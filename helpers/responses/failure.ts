interface IFailure {
  message: string;
  content?: any;
  e?: Error;
}

export function failure(obj: IFailure): { success: boolean; message: string; content: any } {
  const resp = {
    success: false,
    message: `${obj.message}${obj.e?.message ? ` - ${obj.e?.message}` : ""}`,
    content: obj.content,
  };
  console.log("failure resp:", resp);

  return resp;
}
