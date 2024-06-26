'use strict'
import { XrplClient } from 'xrpl-client'

 /* eslint-disable */ 
export const AppStore = {
    state: () => ({
        version: '0.0.1',
        xumm: {
            tokenData: {
                nodetype: 'MAINNET'
            }
        },
        signed_in: true,

        xrpl: {
            client: null,
            nodes: [],
            account: '',
            books: {},
            paths: {},
            history: [],
            trustlines: []
        },
        xahau: {
            client: null,
            nodes: [],
            account: '',
            books: {},
            paths: {},
            history: [],
            trustlines: []
        }
    }),
    actions: {
        xummTokenData({commit}, data) {
            commit('TOKEN_DATA', data)
        },
        clientConnect({commit}, data) {
            commit('CONNECT', data)
        },
        setClientNodes({commit}, data) {
            commit('NODES', data)
        },
        setAccount({commit}, data) {
            commit('ACCOUNT', data)
        },
        setTrustLines({commit}, data) {
            commit('TRUSTLINES', data)
        },
        setSignIn({commit}, signed_in) {
            commit('SIGNIN', signed_in)
        },
        clearBooks({commit}, network) {
            commit('BOOKS_CLEAR', network)
        },
        listenBook({commit}, data) {
            commit('BOOKS', data)
        },
        updateBook({commit}, data) {
            commit('BOOK_UPDATE', data)
        },
        updatePath({commit}, data) {
            commit('PATH_UPDATE', data)
        },
        pushHistoryExchange({commit}, data) {
            commit('HISTORY_EXCHANGE', data)
        },
        clearHistoryExchange({commit}, network) {
            commit('HISTORY_EXCHANGE_CLEAR', network)
        },
    },
    mutations: {
        // INIT(state, force = false) {
        //     if (force === false) { return }
        //     if (localStorage.getItem('account')) {
        //         state.account = JSON.parse(localStorage.getItem('account'))
        //         console.log('loaded account from state', state.account)
        //     }
        //     if (localStorage.getItem('trustlines')) {
        //         state.trustlines = JSON.parse(localStorage.getItem('trustlines'))
        //         console.log('loaded trustlines from state', state.trustlines)
        //     }
        //     if (localStorage.getItem('network')) {
        //         state.network = JSON.parse(localStorage.getItem('network'))
        //         console.log('loaded network from state', state.network)
        //     }
        //     if (localStorage.getItem('tokenData'))
        //         state.xumm.tokenData = JSON.parse(localStorage.getItem('tokenData'))
        //     if (localStorage.getItem('signed_in'))
        //         state.signed_in = JSON.parse(localStorage.getItem('signed_in'))
        //     console.log('state loaded from storage: ', state)
        // },
        // CLEAR(state, force = false) {
        //     if (force === false) { return }
        //     localStorage.clear()
        // },
        TOKEN_DATA(state, data) {
            state.xumm.tokenData = data
            localStorage.setItem('tokenData', JSON.stringify(data))
        },
        SIGNIN(state, signed_in) {
            console.log('signed in set in state', signed_in)
            state.signed_in = signed_in
            localStorage.setItem('signed_in', JSON.stringify(signed_in))
        },
        CONNECT(state, data) {
            if (state[data.network] === undefined) { return }
            if (state[data.network].nodes.length < 0) { return }
            if (data.force || state[data.network].client === null) {
                state[data.network].client = new XrplClient(state[data.network].nodes)
                console.log('connecting', data.network, state[data.network].nodes)
            }
        },
        NODES(state, data) {
            if (state[data.network] === undefined) { return }
            state[data.network].nodes = data.nodes
            if (state[data.network].client !== null) {
                state[data.network].client.close()
            }
            state[data.network].client = new XrplClient(state[data.network].nodes)
        },
        ACCOUNT(state, data) {
            state[data.network].account = data.account
            // localStorage.setItem('account', JSON.stringify(account))
        },
        TRUSTLINES(state, data) {
            state[data.network].trustlines = data.trustlines
            // localStorage.setItem('trustlines', JSON.stringify(trustlines))
        },
        BOOKS(state, data) {
            const key = data.base + data.base_issuer + data.quote + data.quote_issuer + '-' + data.network
            if (state[data.network].books[key] === undefined) {
                state[data.network].books[key] = {
                    name: data.name,
                    network: data.network,
                    type: data.type,
                    market: data.market,
                    base: data.base,
                    quote: data.quote,
                    base_issuer: data.base_issuer,
                    quote_issuer: data.quote_issuer,
                    book: {
                        bids: [],
                        asks: []
                    }
                }
            } 
            // localStorage.setItem('books', JSON.stringify(books))
        },
        BOOKS_CLEAR(state, network) {
            state[network].books = {}
        },
        BOOK_UPDATE(state, data) {
            if (state[data.network] === undefined) { return }
            if (state[data.network].books[data.key] !== undefined) {
                const asks = Object.values(data.book.asks).sort((a,b) => (a.limit_price*1 > b.limit_price*1) ? 1 : ((b.limit_price*1 > a.limit_price*1) ? -1 : 0))
                const bids = Object.values(data.book.bids).sort((a,b) => (a.limit_price*1 < b.limit_price*1) ? 1 : ((b.limit_price*1 < a.limit_price*1) ? -1 : 0))

                const values = {
                    bids: bids,
                    asks: asks.reverse()
                }

                state[data.network].books[data.key].book = values
            }
        },
        PATH_UPDATE(state, data) {
            // console.log('seeetttt', data.key)
            state[data.network].paths[data.key] = data
        },
        HISTORY_EXCHANGE(state, data) {
            const order = data.order
            const key = data.key

            const copyAll = [...state[data.network].history]
            copyAll.unshift(order)
            while (copyAll.length > 100) {
                copyAll.pop()
            }
            state[data.network].history = copyAll
        },
        HISTORY_EXCHANGE_CLEAR(state, network) {
            state[network].history = []
        }
    },
    getters: {
        getVersion: state => {
            return state.version
        },
        getXummTokenData: state => {
            return state.xumm.tokenData
        },
        getClient: (state) => (network) => {
            return state[network].client
        },
        getClientNodes: (state) => (network) => {
            return state[network].nodes
        },
        getAccount: (state) => (network) => {
            return state[network].account
        },
        getTrustlines: (state) => (network) => {
            return state[network].trustlines
        },
        signedIn: state => {
            return state.signed_in
        },
        getExchangeBook: (state) => (key) => {
            if (key in state.books) {
                return state.books[key]
            }
            return {
                bids: [],
                asks: []
            }
        },
        getBooks: (state) => (network) => {
            return state[network].books
        },
        getPath: (state) => (data) => {
            // console.log('ggggeeettt', data.key)
            // console.log('ggggeeettt', state.paths[key])
            if (data.key in state[data.network].paths) {
                return state[data.network].paths[data.key]
            }
            return undefined
        },
        getHistoryAll: (state) => (network) => {
            return state[network].history
        },
        // getHistoryExchange: (state) => (key) => {
        //     if (key in state.exchange) {
        //         return state.exchange[key].history
        //     }
        //     return []
        // },
    }
}