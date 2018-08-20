import * as U from '@shared/utils'

it('U.isValidPhoneNumber', () => {
  const invalidNumbers = ['123', 'asdf', '32040', '']
  const expectInvalid = (n: string) => expect(U.isValidPhoneNumber(n)).toEqual(false)
  invalidNumbers.map(expectInvalid)

  const validNumbers = [
    '6519167199', // U.S. without international code
    '16519167199', // U.S. with international code
    '651967199',
  ]
  const expectValid = (n: string) => expect(U.isValidPhoneNumber(n)).toEqual(true)
  validNumbers.map(expectValid)
})
