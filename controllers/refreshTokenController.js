const jwt = require('jsonwebtoken')
const User = require('../model/User')

const handleRefreshToken = async (req, res) => {
	const cookies = req.cookies

	if (!cookies?.jwt) {
		return res.sendStatus(401)
	}

	const refreshToken = cookies.jwt

	const foundUser = await User.findOne({ refreshToken }).exec()

	if (!foundUser) {
		return res.sendStatus(403)
	}

	jwt.verify(
		refreshToken,
		process.env.REFRESH_TOKEN_SECRET,
		(err, decode) => {
			if (err || foundUser.name !== decode.name) {
				return res.sendStatus(403)
			}

			const roles = Object.values(foundUser.roles)

			const accessToken = jwt.sign(
				{
					UserInfo: {
						name: decode.name,
						roles: roles
					}
				},
				process.env.ACCESS_TOKEN_SECRET,
				{ expiresIn: '30s' }
			)

			res.json({ accessToken })
		}
	)
}

module.exports = { handleRefreshToken }