import {inngest} from "@/lib/inngest/client";
import {NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT} from "@/lib/inngest/prompts";
import {sendNewsSummaryEmail, sendWelcomeEmail, sendAlertEmail} from "@/lib/nodemailer";
import {getAllUsersForNewsEmail} from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews, getCurrentPrice } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import AlertRecord from '@/database/models/alert.model';
import { connectToDatabase } from '@/database/mongoose';

export const sendSignUpEmail = inngest.createFunction(
    { id: 'sign-up-email' },
    { event: 'app/user.created'},
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
            body: {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }]
            }
        })

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) ||'Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.'

            const { data: { email, name } } = event;

            return await sendWelcomeEmail({ email, name, intro: introText });
        })

        return {
            success: true,
            message: 'Welcome email sent successfully'
        }
    }
)

export const sendDailyNewsSummary = inngest.createFunction(
    { id: 'daily-news-summary' },
    [ { event: 'app/send.daily.news' }, { cron: '0 12 * * *' } ],
    async ({ step }) => {
        // ! Step #1: Get all users for news delivery
        const users = await step.run('get-all-users', getAllUsersForNewsEmail)

        if(!users || users.length === 0) return { success: false, message: 'No users found for news email' };

        // ! Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
        const results = await step.run('fetch-user-news', async () => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];
            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);
                    // Enforce max 6 articles per user
                    articles = (articles || []).slice(0, 6);
                    // If still empty, fallback to general
                    if (!articles || articles.length === 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error('daily-news: error preparing user news', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }
            return perUser;
        });

        // ! Step #3: (placeholder) Summarize news via AI
        const userNewsSummaries: { user: UserForNewsEmail; newsContent: string | null }[] = [];

        for (const { user, articles } of results) {
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));

                const response = await step.ai.infer(`summarize-news-${user.email}`, {
                    model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
                    body: {
                        contents: [{ role: 'user', parts: [{ text:prompt }]}]
                    }
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent = (part && 'text' in part ? part.text : null) || 'No market news.'

                userNewsSummaries.push({ user, newsContent });
            } catch (e) {
                console.error('Failed to summarize news for : ', user.email);
                userNewsSummaries.push({ user, newsContent: null });
                console.error(e)

            }
        }

        // ! Step #4: (placeholder) Send the emails
        await step.run('send-news-emails', async () => {
            await Promise.all(
                userNewsSummaries.map(async ({ user, newsContent}) => {
                    if(!newsContent) return false;

                    return await sendNewsSummaryEmail({ email: user.email, date: getFormattedTodayDate(), newsContent })
                })
            )
        })

        return { success: true, message: 'Daily news summary emails sent successfully' }
    }
)

export const checkPriceAlerts = inngest.createFunction(
    { id: 'check-price-alerts' },
    [ { event: 'app/check.alerts' }, { cron: '0 * * * *' } ], // Run every hour
    async ({ step }) => {
        // Step 1: Get all active alerts with user emails
        const alertsWithUsers = await step.run('get-active-alerts', async () => {
            const mongoose = await connectToDatabase();
            
            // Look up all active alerts
            const activeAlerts = await AlertRecord.find({ isActive: true }).lean();
            if (!activeAlerts || activeAlerts.length === 0) return [];

            // Get unique user IDs to fetch emails
            const userIds = [...new Set(activeAlerts.map(a => a.userId))];
            
            // Query the 'user' collection created by better-auth adapter
            const db = mongoose.connection.db;
            if(!db) throw new Error("Database connection error");

            const users = await db.collection('user').find({ _id: { $in: userIds } }).project({ _id: 1, email: 1, name: 1 }).toArray();
            
            const userMap = new Map(users.map(u => [u._id.toString(), u]));

            return activeAlerts.map(alert => ({
                alert,
                user: userMap.get(alert.userId)
            })).filter(item => item.user); // Only keep alerts where we found the user
        });

        if (alertsWithUsers.length === 0) {
            return { success: true, message: 'No active alerts to process' };
        }

        // Step 2: Extract unique symbols and fetch their current prices
        const uniqueSymbols = [...new Set(alertsWithUsers.map(item => item.alert.symbol))];
        
        const currentPrices = await step.run('fetch-current-prices', async () => {
            const prices: Record<string, number> = {};
            for (const symbol of uniqueSymbols) {
                try {
                    const price = await getCurrentPrice(symbol);
                    if (price !== null) {
                        prices[symbol] = price;
                    }
                } catch (error) {
                    console.error(`Failed to fetch price for ${symbol}:`, error);
                }
            }
            return prices;
        });

        // Step 3: Evaluate conditions and trigger emails
        const triggeredAlerts = await step.run('evaluate-and-trigger-alerts', async () => {
             const triggered = [];
             
             for (const { alert, user } of alertsWithUsers) {
                 const currentPrice = currentPrices[alert.symbol];
                 if (!currentPrice || !user || !user.email) continue;
                 
                 let isTriggered = false;
                 
                 if (alert.condition === 'greater_than' && currentPrice >= alert.targetPrice) {
                     isTriggered = true;
                 } else if (alert.condition === 'less_than' && currentPrice <= alert.targetPrice) {
                     isTriggered = true;
                 }

                 if (isTriggered) {
                      try {
                          await sendAlertEmail({
                              email: user.email,
                              company: alert.symbol, // Best effort fallback if full company name requires another fetch
                              symbol: alert.symbol,
                              targetPrice: alert.targetPrice,
                              currentPrice,
                              condition: alert.condition as 'greater_than' | 'less_than'
                          });
                          
                          // Deactivate alert
                          await connectToDatabase();
                          await AlertRecord.findByIdAndUpdate(alert._id, { isActive: false });
                          
                          triggered.push(alert._id);
                      } catch (emailError) {
                          console.error(`Failed to send alert email for ${alert.symbol} to ${user.email}`, emailError);
                      }
                 }
             }
             
             return triggered;
        });

        return { 
            success: true, 
            message: `Evaluated ${alertsWithUsers.length} alerts. Triggered ${triggeredAlerts.length} emails.` 
        };
    }
);