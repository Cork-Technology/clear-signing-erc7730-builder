"use client";

import { Button } from "~/components/ui/button";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { type UseFormReturn } from "react-hook-form";
import { type OperationFormType } from "./editOperation";
import { type Operation } from "~/store/types";
import FieldSelector from "./fields/fieldSelector";
import { Trash } from "lucide-react";
import OperationScreens from "./operationScreens";
import { Card } from "~/components/ui/card";
import ValidOperationButton from "./validOperationButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { useErc7730Store } from "~/store/erc7730Provider";

const FieldNotIncluded = ({
  form,
  index,
}: {
  form: UseFormReturn<OperationFormType>;
  index: number;
}) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-8">
    <div>
      This field is not included and will not be displayed to the user during
      their operation.
    </div>
    <FormField
      control={form.control}
      name={`fields.${index}.isIncluded`}
      render={({ field }) => (
        <Button onClick={() => field.onChange(true)}>Include</Button>
      )}
    />
  </div>
);

const FieldHeader = ({
  field,
  form,
  index,
}: {
  field: Operation["fields"][number];
  form: UseFormReturn<OperationFormType>;
  index: number;
}) => (
  <div className="flex items-center justify-between">
    <div>{field.path}</div>
    <FormField
      control={form.control}
      name={`fields.${index}.isIncluded`}
      render={({ field }) => (
        <Button variant="outline" onClick={() => field.onChange(false)}>
          <Trash />
        </Button>
      )}
    />
  </div>
);

const FieldLabelInput = ({
  form,
  index,
}: {
  form: UseFormReturn<OperationFormType>;
  index: number;
}) => (
  <FormField
    control={form.control}
    name={`fields.${index}.label`}
    render={({ field }) => (
      <FormItem>
        <FormLabel>Field Name</FormLabel>
        <FormControl>
          <Input
            placeholder="Enter field name"
            value={field.value || ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

const FieldRequiredSwitch = ({
  form,
  index,
}: {
  form: UseFormReturn<OperationFormType>;
  index: number;
}) => (
  <FormField
    control={form.control}
    name={`fields.${index}.isRequired`}
    render={({ field }) => (
      <FormItem className="flex items-center gap-3">
        <FormLabel className="mt-1">Required</FormLabel>
        <FormControl>
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        </FormControl>
      </FormItem>
    )}
  />
);

const FieldVisibilitySelect = ({
  form,
  index,
}: {
  form: UseFormReturn<OperationFormType>;
  index: number;
}) => (
  <FormField
    control={form.control}
    name={`fields.${index}.visible`}
    render={({ field: visibleField }) => (
      <FormItem>
        <FormLabel>Visibility (v2)</FormLabel>
        <Select
          onValueChange={(val) => {
            visibleField.onChange(val);
            form.setValue(
              `fields.${index}.isIncluded`,
              val !== "never",
            );
            form.setValue(
              `fields.${index}.isRequired`,
              val === "always",
            );
          }}
          value={visibleField.value ?? "always"}
        >
          <SelectTrigger className="h-8 w-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="always">Always show</SelectItem>
            <SelectItem value="optional">Optional</SelectItem>
            <SelectItem value="never">Never show (excluded)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Controls when this field is displayed to users during signing.
        </p>
      </FormItem>
    )}
  />
);

interface Props {
  form: UseFormReturn<OperationFormType>;
  operation: Operation | null;
  field: Operation["fields"][number];
  index: number;
  onContinue?: () => void;
  onPrevious?: () => void;
  onLast?: () => void;
}

const FieldForm = ({
  field,
  form,
  index,
  operation,
  onContinue,
  onPrevious,
  onLast,
}: Props) => {
  const { isIncluded, path } = form.watch(`fields.${index}`);
  const schemaVersion = useErc7730Store((s) => s.schemaVersion);

  if (!operation) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-4">
        {!isIncluded ? (
          <FieldNotIncluded form={form} index={index} />
        ) : (
          <Card className="flex flex-col gap-4 p-6">
            <FieldHeader field={field} form={form} index={index} />
            <FieldLabelInput form={form} index={index} />
            {schemaVersion === "v2" ? (
              <FieldVisibilitySelect form={form} index={index} />
            ) : (
              <FieldRequiredSwitch form={form} index={index} />
            )}
            <FieldSelector field={field} form={form} index={index} />
          </Card>
        )}
        <div className="mt-10 flex justify-between">
          {onPrevious && <Button onClick={onPrevious}>Previous</Button>}
          {onContinue && <Button onClick={onContinue}>Continue</Button>}
          {onLast && (
            <ValidOperationButton
              isValid={form.formState.isValid}
              onClick={onLast}
            />
          )}
        </div>
      </div>
      <OperationScreens
        form={form}
        allScreenActive={false}
        activeFieldPath={path}
        operation={operation}
      />
    </div>
  );
};

export default FieldForm;
