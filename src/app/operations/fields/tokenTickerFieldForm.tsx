import { FormDescription, FormLabel } from "~/components/ui/form";

const TokenTickerFieldForm = () => {
  return (
    <div>
      <FormLabel>Token Ticker</FormLabel>
      <FormDescription>
        Display address as an ERC-20 token ticker symbol (e.g.
        &quot;USDT&quot;).
      </FormDescription>
    </div>
  );
};

export default TokenTickerFieldForm;
