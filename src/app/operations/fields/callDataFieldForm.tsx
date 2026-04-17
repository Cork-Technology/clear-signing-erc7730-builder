import { z } from "zod";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { type UseFormReturn } from "react-hook-form";
import { type OperationFormType } from "../editOperation";

export const CalldataParametersFormSchema = z.object({
  calleePath: z.string().optional(),
  callee: z.string().optional(),
  selector: z.string().optional(),
});

interface Props {
  form: UseFormReturn<OperationFormType>;
  index: number;
}

const CallDataFieldForm = ({ form, index }: Props) => {
  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name={`fields.${index}.params.calleePath`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Callee Path</FormLabel>
            <FormDescription>
              Path to the address of the contract being called by the embedded
              calldata. Use this OR Callee (constant address).
            </FormDescription>
            <FormControl>
              <Input
                {...field}
                value={String(field.value ?? "")}
                placeholder="e.g. @.to"
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`fields.${index}.params.callee`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Callee (constant)</FormLabel>
            <FormDescription>
              The constant address of the contract being called. Use this OR
              Callee Path.
            </FormDescription>
            <FormControl>
              <Input
                {...field}
                value={String(field.value ?? "")}
                placeholder="0x..."
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`fields.${index}.params.selector`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Selector</FormLabel>
            <FormDescription>
              Optional function selector hex string. If omitted, the first 4
              bytes of the calldata are used.
            </FormDescription>
            <FormControl>
              <Input
                {...field}
                value={String(field.value ?? "")}
                placeholder="0xa9059cbb"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};

export default CallDataFieldForm;
