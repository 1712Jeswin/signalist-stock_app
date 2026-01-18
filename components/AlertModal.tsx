"use client";

import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import { CONDITION_OPTIONS } from "@/lib/constants";
import { createAlert } from "@/lib/actions/alert.actions";
import { toast } from "sonner";
import { useTransition } from "react";

const FREQUENCY_OPTIONS = [
    { value: 'once', label: 'Once' },
    { value: 'daily', label: 'Daily' },
];

export default function AlertModal({ 
    open, 
    setOpen, 
    stock, 
    userEmail 
}: AlertModalProps) {
    const { register, control, handleSubmit, formState: { errors }, reset } = useForm<AlertData>({
        defaultValues: {
            condition: 'greater',
            threshold: '',
            frequency: 'once',
        }
    });

    const [isPending, startTransition] = useTransition();

    const onSubmit = (data: AlertData) => {
        if (!stock) return;

        startTransition(async () => {
            const result = await createAlert(userEmail, {
                symbol: stock.symbol,
                company: stock.company,
                logoUrl: stock.logo,
                condition: data.condition,
                targetPrice: Number(data.threshold),
                frequency: data.frequency,
            });

            if (result.success) {
                toast.success("Alert set successfully");
                setOpen(false);
                reset();
            } else {
                toast.error(result.error || "Failed to set alert");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Set Price Alert for {stock?.symbol}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    <div className="grid gap-4">
                        <SelectField
                            name="condition"
                            label="Condition"
                            placeholder="Select condition"
                            options={CONDITION_OPTIONS}
                            control={control}
                            error={errors.condition as never}
                            required
                        />
                        <InputField
                            name="threshold"
                            label="Target Price ($)"
                            placeholder="e.g. 240.50"
                            type="number"
                            register={register}
                            error={errors.threshold as never}
                            validation={{ 
                                required: "Target price is required",
                                min: { value: 0.01, message: "Price must be greater than 0" }
                            }}
                        />
                        <SelectField
                            name="frequency"
                            label="Frequency"
                            placeholder="Select frequency"
                            options={FREQUENCY_OPTIONS}
                            control={control}
                            error={errors.frequency as never}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button 
                            type="submit" 
                            disabled={isPending}
                            className="w-full bg-yellow-500 text-black hover:bg-yellow-600 font-bold"
                        >
                            {isPending ? "Setting Alert..." : "Set Alert"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
