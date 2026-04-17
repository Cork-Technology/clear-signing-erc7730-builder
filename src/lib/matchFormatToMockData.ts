import { type OperationFormType } from "~/app/operations/editOperation";

const matchFieldFormatToMockData = (
  format: OperationFormType["fields"][number]["label"],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  params: any,
) => {
  switch (format) {
    case "raw":
      return "1000";
    case "amount":
      return "0.19866144 ETH";
    case "tokenAmount":
      return "0.19866144 DAI";
    case "nftName":
      return "CryptoKitty";
    case "date":
      return "2024-02-29T08:27:12";
    case "duration":
      return "02:17:30";
    case "chainId":
      return "Ethereum Mainnet";
    case "tokenTicker":
      return "USDT";
    case "enum":
      return "variable";
    case "unit":
      return "10h";
    case "addressName":
      return "vitalik.eth";
    case "calldata":
      return "0xa9059cbb...";
    default:
      return format;
  }
};

export default matchFieldFormatToMockData;
