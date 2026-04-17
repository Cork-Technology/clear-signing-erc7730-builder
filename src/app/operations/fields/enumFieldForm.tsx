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

export const EnumParametersFormSchema = z.object({
  $ref: z.string().min(1, "Enum reference path is required"),
});

interface Props {
  form: UseFormReturn<OperationFormType>;
  index: number;
}

const EnumFieldForm = ({ form, index }: Props) => {
  return (
    <div>
      <FormField
        control={form.control}
        name={`fields.${index}.params.$ref`}
        render={({ field }) => (
          <FormItem className="mb-1">
            <FormLabel>Enum Reference</FormLabel>
            <FormDescription>
              Internal path to the enum definition, e.g.
              $.metadata.enums.interestRateMode
            </FormDescription>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="$.metadata.enums.yourEnumName"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};

export default EnumFieldForm;
