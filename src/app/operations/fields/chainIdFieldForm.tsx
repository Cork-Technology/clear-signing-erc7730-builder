import { FormDescription, FormLabel } from "~/components/ui/form";

const ChainIdFieldForm = () => {
  return (
    <div>
      <FormLabel>Chain ID</FormLabel>
      <FormDescription>
        Value is converted to a blockchain name using EIP-155 reference values
        (e.g. 1 displays as &quot;Ethereum Mainnet&quot;).
      </FormDescription>
    </div>
  );
};

export default ChainIdFieldForm;
