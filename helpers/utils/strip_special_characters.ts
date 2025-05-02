interface IStripSpecialCharacters {
  sourceString: string;
}

const stripSpecialCharacters = ({ sourceString }: IStripSpecialCharacters) => {
  let outString = sourceString.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "");
  return outString;
};

export { IStripSpecialCharacters, stripSpecialCharacters };
