const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('../model/User')

const handleLogin = async (req, res) => {
	const { user, pwd } = req.body

	if (!user || !pwd) {
		return res.status(400).json({ message: 'Name and password are required.' })
	}

	const foundUser = await User.findOne({ name: user }).exec()

	if (!foundUser) {
		return res.sendStatus(401)
	}

	const match = await bcrypt.compare(pwd, foundUser.password)

	if (match) {
		const roles = Object.values(foundUser.roles)

		const accessToken = jwt.sign(
			{
				UserInfo: {
					name: foundUser.name,
					roles: roles
				}
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '30s' }
		)

		const refreshToken = jwt.sign(
			{ name: foundUser.name },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: '1d' }
		)

		foundUser.refreshToken = refreshToken
		await foundUser.save()

		res.cookie(
			'jwt',
			refreshToken,
			{
				httpOnly: true,
				sameSite: 'None',
				// secure: true,	
				maxAge: 24 * 60 * 60 * 1000
			}
		)

		res.json({ accessToken })
	} else {
		res.sendStatus(401)
	}
}

module.exports = { handleLogin }