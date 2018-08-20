/*
  Correlation of stars/strength
  1 star = 5%
  2 stars = 20%
  3 stars = ?%
  4 stars = ?%
  5 stars = ?%

  percentToNextStar is derived from the current stars/strength and what's next

  Examples:
  - User has nothing attested (0 stars / 0% strength)
  - User has email attested, but not phone (1 star / 5% strength)
  - User has phone attested, but not email (1 star / 5% strength)
  - User has both email/phone attested (1 star / 10% strength)
*/
export type IBloomIDStats = {
  stars: number
  strength: number
  percentToNextStar: number
}
