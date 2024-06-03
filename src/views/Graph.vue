<template>
    
    <div class="row">
        <div class="col ms-5">
            <div class="input-group mb-2">
                <span class="input-group-text">Network</span>
                <select v-model="network" v-on:change="handleChangeNetwork($event)">
                    <option v-for="(option, index) in networks" :value="option.value" :key="index">
                        {{ option.label }}
                    </option>
                </select>
            </div>
            <div class="input-group mb-2">
                <span class="input-group-text">Animate</span>
                <select v-model="animation" v-on:change="handleChangeAnimation($event)">
                    <option v-for="(option, index) in animations" :value="option.value" :key="index">
                        {{ option.label }}
                    </option>
                </select>
            </div>
            <div class="input-group mb-2">
                <div class="form-check form-switch">
                    <input v-model="pause" v-on:click="handleChangePause" class="form-check-input" type="checkbox" role="switch" id="flexBloomPause" checked>
                    <label class="form-check-label text-white" for="flexBloomPause">Pause Data</label>
                </div>
            </div>
            <div class="input-group mb-2">
                <div class="form-check form-switch">
                    <input v-model="dimentions" v-on:click="handleChangDimentions" class="form-check-input" type="checkbox" role="switch" id="flexDimentionsSwitch" checked>
                    <label class="form-check-label text-white" for="flexDimentionsSwitch">2D/3D</label>
                </div>
            </div>
            <div class="input-group mb-2">
                <div class="form-check form-switch">
                    <input v-model="bloom_show" v-on:click="handleChangeBloom" class="form-check-input" type="checkbox" role="switch" id="flexBloomSwitch" checked>
                    <label class="form-check-label text-white" for="flexBloomSwitch">Bloom Pass</label>
                </div>
            </div>
            <!-- <div class="input-group mb-2">
                <div class="form-check form-switch">
                    <input v-model="interaction" v-on:click="handleChangeInteraction" class="form-check-input" type="checkbox" role="switch" id="flexInteractionmSwitch" checked>
                    <label class="form-check-label text-white" for="flexInteractionSwitch">Click Nodes (performance degrades)</label>
                </div>
            </div> -->
            
        </div>
        
    </div>
    <div class="row"><div class="col text-center"><h1>{{ ledger }}</h1><small class="text-white">accounts renderered: {{ Object.keys(this.accounts).length }}</small> <small class="text-white">ledgers: {{ ledgers }}</small></div></div>
    <div id="3d-graph"></div>
    <div class="text-white">
        <p>spam accounts removed: {{ ignored.join(', ') }}</p>
    </div>
    
</template>

<script>
import pathParser from 'xrpl-tx-path-parser'
import ForceGraph3D from '3d-force-graph'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'
import { forEach } from 'lodash'


const glitchPass = new GlitchPass(64)
const bloomPass = new UnrealBloomPass()
bloomPass.strength = 2
bloomPass.radius = 1
bloomPass.threshold = 0

export default {
    name: 'Graph',
    components: {
    },
    data() {
        return {
            client: undefined,
            network: 'xrpl',
            dimentions: true,
            bloom_show: true,
            animation: 1200,
            animations: [
                { label: '200ms', value: 200 },
                { label: '800ms', value: 800 },
                { label: '1200ms', value: 1200 },
                { label: 'Infinity', value: Infinity },
            ],
            interaction: true,
            networks: [
                {label: 'xrpl', value: 'xrpl'},
                {label: 'xahau', value: 'xahau'}
            ],
            ledger: undefined,
            graph: undefined,
            accounts: {},
            loaded: false,
            nodes: [],
            links: [],
            ledgers: 0,
            pause: false,
            pausedRefill: [],
            ignored: [
               // 'rxRpSNb1VktvzBz8JF2oJC6qaww6RZ7Lw'
            ] // remove spam from the render, if wanted.
        }
    },
    computed: {
    },
    
    async mounted() {
        console.log('loading...')
        
        this.$store.dispatch('clientConnect',  { network: this.network, force: false })
        await this.connect()

        
        this.graph = ForceGraph3D({
            controlType: 'trackball'// fly
        })

        // this.graph.forceEngine('ngraph')

        (document.getElementById('3d-graph'))
            .backgroundColor('rgba(0,0,0,0)')
            .graphData({nodes: this.nodes, links: this.links})
            .nodeLabel('id')
            .nodeVal('size')
            .enableNodeDrag(false)
            .onNodeClick(node => window.open((this.network === 'xrpl') ? `https://livenet.xrpl.org/transactions/${node.hash}`:`https://xahau.xrpl.org/transactions/${node.hash}`, '_blank'))
        
        this.graph.postProcessingComposer().addPass(bloomPass)
    },
    methods: {
        handleChangeBloom() {
            if (!this.bloom_show) {
                this.graph.postProcessingComposer().addPass(bloomPass)
            }
            else {
                this.graph.postProcessingComposer().removePass(bloomPass)
            }
            this.graph.graphData({
                nodes: this.nodes,
                links: this.links
            })
        },
        handleChangeInteraction() {
            console.log('handleChangeInteraction', !this.interaction)
            this.graph.enablePointerInteraction(!this.interaction)
            if (!this.interaction) {
                this.graph.onNodeClick(node => window.open((this.network === 'xrpl') ? `https://livenet.xrpl.org/accounts/${node.id}`:`https://xahau.xrpl.org/accounts/${node.id}`, '_blank'))
            }
            else {
                this.graph.onNodeClick()
            }
        },
        handleChangePause() {
            if (this.pause) {
                this.pausedRefill.forEach(ledger_result => {
                    // console.log('RF', ledger_result)
                    if ('ledger' in ledger_result && 'transactions' in ledger_result.ledger) {
                        // console.log('transactions', transactions)

                        for (let i = 0; i < ledger_result.ledger.transactions.length; i++) {
                            const transaction = ledger_result.ledger.transactions[i]
                            // todo
                            if (transaction.TransactionType === 'Payment') {
                                this.graphPayment(transaction)
                            }
                            if (transaction.TransactionType === 'OfferCreate') {
                                this.graphOfferCreate(transaction)
                            }
                        }
                    }
                    this.ledgers++
                })
                this.graph.graphData({
                    nodes: this.nodes,
                    links: this.links
                })
                this.pausedRefill = []
            }

            
        },
        handleChangeAnimation(event) {
            this.graph.cooldownTime(this.animation)
        },
        handleChangDimentions() {
            (!this.dimentions) ? this.graph.numDimensions(3) : this.graph.numDimensions(2)
        },
        async handleChangeNetwork(event) {
            this.network = event.target.value
            

            this.$store.dispatch('clientConnect',  { network: this.network, force: false })
            await this.connect()

            this.ledgers = 0
            this.nodes = []
            this.links = []
            this.accounts = {}
            this.graph.graphData({
                nodes: this.nodes,
                links: this.links
            })
        },
        async connect() {
            if (this.client !== undefined) {
                this.client.close()
            }
            let nodes
            if (this.network ==='xrpl') {
                nodes = import.meta.env.VITE_APP_XRPL_WSS.split(', ')
                this.$store.dispatch('setClientNodes', { network: 'xrpl', nodes: nodes })
            }
            else {
                nodes = import.meta.env.VITE_APP_XAH_WSS.split(', ')
                this.$store.dispatch('setClientNodes', { network: 'xahau', nodes: nodes })
            }
            

            console.log('connect ' + this.network)
            this.$store.dispatch('clearBooks', this.network)
            this.$store.dispatch('clientConnect', { network: this.network, force: false })
            
            await this.ledgerClose()
            // await this.accountTX('rapido5rxPmP4YkMZZEeXSHqWefxHEkqv6')
            // await this.accountTX('rTeLeproT3BVgjWoYrDYpKbBLXPaVMkge')
            // await this.accountTX('rfKsmLP6sTfVGDvga6rW6XbmSFUzc3G9f3')
            
        },
        async ledgerClose() {
            this.client = this.$store.getters.getClient(this.network)
            console.log(await this.client.send({'command': 'server_info'}))
            const callback = async (event) => {
                
                let request = {
                    'id': 'xrpl-local',
                    'command': 'ledger',
                    'ledger_hash': event.ledger_hash,
                    'ledger_index': 'validated',
                    'transactions': true,
                    'expand': true,
                    'owner_funds': true
                }
                const ledger_result = await this.client.send(request)
                // console.log('ledger_result', ledger_result)
                if ('error' in ledger_result) { return }

                
                console.log('ledger_index', ledger_result.ledger.ledger_index)
                this.ledger = ledger_result.ledger.ledger_index

                if (this.pause) { 
                    this.pausedRefill.push(ledger_result)
                    return 
                }
                if ('ledger' in ledger_result && 'transactions' in ledger_result.ledger) {
                    // console.log('transactions', transactions)

                    for (let i = 0; i < ledger_result.ledger.transactions.length; i++) {
                        const transaction = ledger_result.ledger.transactions[i]
                        if (transaction.TransactionType === 'Payment') {
                           this.graphPayment(transaction)
                        }
                        if (transaction.TransactionType === 'OfferCreate') {
                            this.graphOfferCreate(transaction)
                        }
                    }
                }

                this.graph.graphData({
                    nodes: this.nodes,
                    links: this.links
                })
                this.ledgers++
            }

            this.client.on('ledger', callback)
        },
        graphOfferCreate(transaction) {
            transaction.meta  = transaction.metaData
            try {
                const data = pathParser(transaction)
                // console.log(data)
                this.graphData(data, transaction, 'dex')
            } catch (e) {
                // ignore...
            }
            
        },
        graphPayment(transaction) {
            transaction.meta  = transaction.metaData
            try {
                const data = pathParser(transaction)
                this.graphData(data, transaction)
            } catch (e) {
                // ignore...
            }
        },
        scaleValue(value) {
            if (value < 1) { return 1 }
            if (value < 10) { return 2 }
            if (value < 100) { return 5 }
            if (value < 1_000) { return 12 }
            if (value < 10_000) { return 40 }
            if (value < 100_000) { return 60 }
            if (value < 1_000_000) { return 70 }
            if (value < 10_000_000) { return 80 }
            if (value < 100_000_000) { return 100 }
            if (value < 1_000_000_000) { return 500 }
        },
        graphData(data, transaction, type = undefined) {
            for (let index = 0; index < data.accountBalanceChanges.length; index++) {
                let value = 0
                const element = data.accountBalanceChanges[index]

                //size elements
                
                element.balances.forEach(bal => {
                    if (bal.currency === 'XRP') {
                        value = Math.abs(Number(bal.value))
                    }
                })

                if (this.ignored.includes(element.account)) { continue }
                
                const group = type !== undefined ? type: element.isAMM ? 'amm': element.isOffer ? 'dex' : element.isDirect? 'direct' : 'rippling'
                // bit complicated here as there is a bug in .isOffer
                let color
                if (type === 'dex') {
                    color = element.isAMM ? '#FF1A8B': '#00E56a'
                }
                else {
                    color = element.isAMM ? '#FF1A8B': element.isOffer ? '#00E56a' : element.isDirect? '#974CFF' : '#FFFFFF'
                }
                // find teleport.
                if (element.account === 'rTeLeproT3BVgjWoYrDYpKbBLXPaVMkge') {
                    color = '#ffa500'
                }
                // corium bridge
                if (element.account === 'rxXXXeMX8Gy5YvibvGLnQJ1XKKD7UswM1') {
                    color = '#ffa500'
                }

                if (this.accounts[element.account] === undefined) {
                    this.accounts[element.account] = {
                        account: element.account
                    }

                    this.nodes.push({ id: element.account, group, color, hash: transaction.hash, size: this.scaleValue(value) })
                }
                else {
                    // update colors to the latest other wise.
                    for (let index = 0; index < this.nodes.length; index++) {
                        const node = this.nodes[index]
                        if (node.id !== element.account) { continue }
                        if (node.color !== color && node.group !== 'amm') {
                            // console.log('color changed', element.account, node.color, color)
                            node.color = color
                        }
                        if (value !== 0 && this.nodes[index].size !== undefined) {
                            this.nodes[index].size = this.scaleValue(value)
                        }
                        if (this.nodes[index].size !== undefined) {
                            this.nodes[index].size = this.scaleValue(value)
                        }
                        
                    }
                }

                if (data.sourceAccount !== element.account) {
                    this.links.push({ source: data.sourceAccount, target: element.account, group })        
                }
            }
        },
        async accountTX(wallet) {
            this.client = this.$store.getters.getClient(this.network)
            console.log(await this.client.send({'command': 'server_info'}))
            let account = await this.client.send({
                'command': 'account_tx',
                'account': wallet,
                'ledger_index_min': -1,
                'ledger_index_max': -1,
                'binary': false,
                'limit': 1000,
                'forward': false
            })
            let marker = account.marker
            console.log(account.transactions.length)
            this.graphAccountTX(account)

            console.log('marker', marker)
            let counter = 0
            while (marker !== undefined) {
                account = await this.client.send({
                    'command': 'account_tx',
                    'account': wallet,
                    'ledger_index_min': -1,
                    'ledger_index_max': -1,
                    'binary': false,
                    'limit': 1000,
                    'forward': false,
                    'marker': marker
                })
                marker = account.marker
                console.log(account.transactions.length)

                this.graphAccountTX(account)
                counter++
                if (counter > 5) { break }
                console.log('counter', counter)
            }
            
        },
        graphAccountTX(account) {
            account.transactions.forEach(data => {
                const transaction = {...data.tx}
                transaction.metaData = {...data.meta}
                if (transaction.TransactionType === 'Payment') {
                    this.graphPayment(transaction)
                }
                if (transaction.TransactionType === 'OfferCreate') {
                    this.graphOfferCreate(transaction)
                }
            })
        },
        currencyHexToUTF8(code) {
            if (code.length === 3)
                return code
            let decoded = new TextDecoder()
                .decode(this.hexToBytes(code))
            let padNull = decoded.length
            while (decoded.charAt(padNull - 1) === '\0')
                padNull--
            return decoded.slice(0, padNull)
        },

        hexToBytes(hex) {
            let bytes = new Uint8Array(hex.length / 2)
            for (let i = 0; i !== bytes.length; i++) {
                bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
            }
            return bytes
        }
    }
}
</script>

<style lang="scss" scoped>
.home {
    color: #ffffff;
}

.graph {
    border: 3px dashed #383838;
}

h1 {
    font-family: "Minecraft";
    font-size: 7em;
    background-image: url("https://img.freepik.com/premium-vector/pixel-art-seamless-background-night-sky-space-8bit-style-vector-illustration-eps-10_148553-724.jpg?w=360");
    color: #fff;
    color: transparent;
    background-size: contain;
    -webkit-background-clip: text;
    filter: drop-shadow(0px -3px 1px rgba(0, 0, 0, 1));
    animation: stripes 5s infinite alternate;
}

@keyframes stripes {
    100% {
        background-position: 100px 0, 100px 0, 100px 0;
    }
}

@font-face {
    font-family: "Minecraft";
    src: url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.eot");
    src: url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.eot?#iefix") format("embedded-opentype"), url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.woff2") format("woff2"), url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.woff") format("woff"), url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.ttf") format("truetype"), url("//db.onlinewebfonts.com/t/6ab539c6fc2b21ff0b149b3d06d7f97c.svg#Minecraft") format("svg");
}
</style>
