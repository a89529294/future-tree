import crypto from 'node:crypto'

export function hashPassword(password: string) {
  return new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(
      password,
      process.env.SALT!,
      100000,
      64,
      'sha256',
      (err, derivedKey) => {
        if (err) {
          reject(err)
        } else {
          const hash = derivedKey.toString('hex')
          resolve(hash)
        }
      },
    )
  })
}
