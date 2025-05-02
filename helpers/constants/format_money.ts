import { thousandSeparator } from "./thousand_separator";

interface IFormatMoney {
  value: string;
  symbol?: string;
  symbolSeparation?: boolean;
  decimalPlaces?: number;
}

const formatMoney = ({ value, symbol = "R", symbolSeparation = false, decimalPlaces = 2 }: IFormatMoney) => {
  return `${symbol}${symbolSeparation ? " " : ""}${thousandSeparator({
    value: value,
    decimalPlaces: decimalPlaces,
  })}`;
};

export { IFormatMoney, formatMoney };
