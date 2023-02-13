import type { AstroCookies } from 'astro'
import { apps, credential } from 'firebase-admin'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { customAlphabet } from 'nanoid/async'
import { lazy } from './lazy'
import { adjectives, nouns } from './words'

const numberid = customAlphabet('0123456789')

const app = lazy(() => {
	if (apps.length === 0) {
		return initializeApp({
			credential: credential.cert(JSON.parse(Buffer.from(import.meta.env.FIREBASE_CREDENTIAL, 'base64').toString()))
		})
	} else {
		return apps[0]!
	}
})
export const firestore = lazy(() => {
	const firestore = getFirestore(app)
	try {
		firestore.settings({ preferRest: true })
	} catch (error) {
		// Catch cursed "Firestore has already been initialized" error
		// console.error(error)
	}
	return firestore
})

export interface User {
	id: string
	createdAt: Timestamp
	email: string
	username: string | null
}

export interface Session {
	id: string
	createdAt: Timestamp
	userId: string
}

export interface Game {
	id: string
	ownerId: string
	createdAt: Timestamp
	modifiedAt: Timestamp
	isDraft: boolean
	name: string
	code: string
}

export interface LoginCode {
	id: string
	createdAt: Timestamp
	userId: string
}

export const getSession = async (cookies: AstroCookies): Promise<{ session: Session, user: User } | null> => {
	if (!cookies.has('sprigSession')) return null
	const _session = await firestore.collection('sessions').doc(cookies.get('sprigSession').value!).get()
	if (!_session.exists) return null
	const session = { id: _session.id, ..._session.data() } as Session

	const _user = await firestore.collection('users').doc(session.userId).get()
	if (!_user.exists) {
		console.warn('Session with invalid user')
		await _session.ref.delete()
		return null
	}
	const user = { id: _user.id, ..._user.data() } as User

	return { session, user }
}

export const makeSession = async (userId: string): Promise<Session> => {
	const data = {
		createdAt: Timestamp.now(),
		userId
	}
	const _session = await firestore.collection('sessions').add(data)
	return { id: _session.id, ...data } as Session
}

export const getGame = async (id: string | undefined): Promise<Game | null> => {
	if (!id) return null
	const _game = await firestore.collection('games').doc(id).get()
	if (!_game.exists) return null
	return { id: _game.id, ..._game.data() } as Game
}

export const makeGame = async (ownerId: string, isDraft: boolean, name?: string, code?: string): Promise<Game> => {
	const data = {
		ownerId,
		createdAt: Timestamp.now(),
		modifiedAt: Timestamp.now(),
		isDraft,
		name: name ?? adjectives[Math.floor(Math.random() * adjectives.length)] + '_' + nouns[Math.floor(Math.random() * nouns.length)],
		code: code ?? ''
	}
	const _game = await firestore.collection('games').add(data)
	return { id: _game.id, ...data } as Game
}

export const getUser = async (id: string): Promise<User | null> => {
	const _user = await firestore.collection('users').doc(id).get()
	if (!_user.exists) return null
	return { id: _user.id, ..._user.data() } as User
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
	const _users = await firestore.collection('users').where('email', '==', email).limit(1).get()
	if (_users.empty) return null
	return { id: _users.docs[0]!.id, ..._users.docs[0]!.data() } as User
}

export const makeUser = async (email: string, username: string | null): Promise<User> => {
	const data = {
		email,
		username,
		createdAt: Timestamp.now()
	}
	const _user = await firestore.collection('users').add(data)
	return { id: _user.id, ...data } as User
}

export const makeLoginCode = async (userId: string): Promise<string> => {
	const code = await numberid(6)
	await firestore.collection('loginCodes').add({
		code,
		userId,
		createdAt: Timestamp.now()
	})
	return code
}

// export const getGame = async (id: string): Promise<Game | null> => {
// 	if (id !== 'test123') return null
// 	return {
// 		id: 'test123',
// 		ownerId: '321tset',
// 		name: 'Test Game',
// 		code: `const player = "p";

// setLegend(
// 	[ player, bitmap\`
// ................
// ................
// .......000......
// .......0.0......
// ......0..0......
// ......0...0.0...
// ....0003.30.0...
// ....0.0...000...
// ....0.05550.....
// ......0...0.....
// .....0....0.....
// .....0...0......
// ......000.......
// ......0.0.......
// .....00.00......
// ................\`]
// );

// setSolids([]);

// let level = 0;
// const levels = [
// 	map\`
// p.....
// ......\`,
// ];

// setMap(levels[level]);

// setPushables({
// 	[ player ]: [],
// });

// onInput("s", () => {
// 	getFirst(player).y += 1
// });

// afterInput(() => {
	
// });`
// 	}
// }