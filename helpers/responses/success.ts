export function success(message: string, content?: any) {
  const resp = {
    success: true,
    message: message,
    content: content,
  };
  // console.log('success resp:', resp);

  return resp;
}
