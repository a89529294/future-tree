export const sleep = (duration = 1000) =>
  new Promise((r) => setTimeout(r, duration))

export function withSleepInDev<TArgs, TResult>(
  handler: (args: TArgs) => Promise<TResult>,
): (args: TArgs) => Promise<TResult> {
  return async (args: TArgs) => {
    if (!process.env.production) await sleep(1000)
    return await handler(args)
  }
}
