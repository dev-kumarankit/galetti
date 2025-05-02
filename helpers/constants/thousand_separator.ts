interface IThousandSeparator {
  value: string;
  separator?: string;
  decimalPlaces?: number;
}

const thousandSeparator = ({ value, separator = " ", decimalPlaces }: IThousandSeparator) => {
  if (decimalPlaces) {
    const rounded = parseFloat(value).toFixed(decimalPlaces);
    return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
};

export { IThousandSeparator, thousandSeparator };
