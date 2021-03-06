const express = require('express')
const multer = require('multer')
const router = new express.Router()
const auth = require('../middleware/auth')
const logoutMarkup = require('../functions/logout_markup')


const User = require('../models/user')

const signupMarkup = () => {
	return `
		<li class="nav-item mx-lg-2  p-2 p-lg-0 ">
            <a href="signup">
                <div class="btn-dark border-0 nav-item fw-bold rounded-pill btn btn-light  btn position-relative" style="background-color: #f86011;">
                Signup
                <div class="position-absolute  bg-dark rounded-pill " id="button-bg"></div>
                </div>
            </a>
        </li>
		`
}

const loginMarkup = () => {
	return `
		<li class="nav-item mx-lg-2  p-2 p-lg-0 ">
            <a href="login">
                <div class="btn-dark border-0 nav-item fw-bold rounded-pill btn btn-light  btn position-relative" style="background-color: #f86011;">
                Login
                <div class="position-absolute  bg-dark rounded-pill " id="button-bg"></div>
                </div>
            </a>
        </li>
		`
}

router.post('/signup', async (req, res) => {
	try{
		const user  = new User(req.body)
		const token = await user.generateAuthToken()
		await user.save()
		
		//cookies
		res.cookie("jwt", token, {
			expires: new Date(Date.now() + 50000),
			httpOnly: true
		})

		res.status(200)
		res.render('index', {
			login_logout: loginMarkup()
		})
	}catch(err){
		console.log("registration error: ", err)
		res.status(500).render('error', {
			msg: err.message
		})
	}
})

router.post('/login', async (req, res) => {
	try{
		const user = await User.findUser(req.body.email, req.body.password)
		const token = await user.generateAuthToken()

		//cookie
		res.cookie("jwt", token, {
			expires: new Date(Date.now() + 500000),
			httpOnly: true,
			// secure: true
		})
		res.status(200)
		res.render('index', {
			login_logout: logoutMarkup()
		})
	}catch(err){
		res.status(500).render('error', {
			msg: err.message
		})
	}
})

router.post('/resetPassword', async (req, res) => {
	try{
		const email = req.body.email
		const user = await User.findOne({email})

		if(!user){
			throw new Error("User not found.")
		}
		user.password = req.body.password
		await user.save()
		res.render('login', {
			alert: '<script>alert("Password updated successfully")</script>' 
		})
	}catch(err){
		res.status(401).render('error', {
			msg: err.message
		})
	}
})

//admin login
router.post('/adminLogin', async (req, res) => {
	try{
		const verify = await User.verifyAdmin(req.body.email, req.body.password, req.body.securityKey)
	
		if(verify)		
			res.render('adminPannel')
	}catch(err){
		console.log("admin login error: ",err)
		res.status(500).render('error', {
			msg: err.message
		})
	}
})

//admin logout
router.get('/adminLogout', async (req, res) => {
	// await User.logoutAdmin()
	try{
		res.render('login')
	}catch(err){
		res.status(500).render('error', {
			msg: err.message
		})
	}
})

//user logout
router.get('/logout', auth, async (req, res) => {
	try{
		req.user.tokens = req.user.tokens.filter((token) => {
			return token.token !== req.token
		})
		const token = await req.user.generateAuthToken()

		res.cookie("jwt", token, {
			expires: new Date(Date.now() +  10),
			httpOnly: true,
			// secure: true
		})

		await req.user.save()
		res.render('index', {
			login_logout: signupMarkup()
		})
	}catch(err){
		console.log(err)
		res.status(500).render('error', {
			msg: err.message
		})
	}
})

router.get('/', (req, res) => {
	res.render('index', {
		login_logout: signupMarkup()
	})
})

router.get('/index', (req, res) => {
	res.render('index', {
		login_logout: signupMarkup()
	})
})

router.get('/signup', (req, res) => {
	res.render('signup')
})

router.get('/login', (req, res) => {
	res.render('login')
})

router.get('/about-us', auth, (req, res) => {
	res.render('about', {
		login_logout: logoutMarkup
	})
})

router.get('/contact-us', auth, (req, res) => {
	res.render('contact', {
		login_logout: logoutMarkup
	})
})

router.get('/menu', auth, auth, (req, res) => {
	res.render('menu', {
		login_logout: logoutMarkup
	})
})

module.exports = router
