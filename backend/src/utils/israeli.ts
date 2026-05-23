// Israeli phone: mobile 05X or landline 0[2-4,7-9], total 9-10 digits.
export const ISRAELI_PHONE_REGEX = /^0(5\d|2|3|4|7|8|9)\d{7,8}$/;

export function isValidIsraeliPhone(phone: string): boolean {
  return ISRAELI_PHONE_REGEX.test(phone.replace(/[-\s]/g, ''));
}

// Israeli ID / business number checksum (Luhn-like, 9 digits, right-padded).
export function isValidIsraeliId(id: string): boolean {
  const digits = id.replace(/\D/g, '');
  if (digits.length === 0 || digits.length > 9) return false;
  const padded = digits.padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(padded[i]) * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}
