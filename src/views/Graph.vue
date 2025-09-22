<template>
    
    <div class="row">
        <div class="col ms-5 mt-5">
            <!-- div class="input-group mb-2">
                <span class="input-group-text">Network</span>
                <select v-model="network" v-on:change="handleChangeNetwork($event)">
                    <option v-for="(option, index) in networks" :value="option.value" :key="index">
                        {{ option.label }}
                    </option>
                </select>
            </div>
            <div class="input-group mb-2">
                <span class="input-group-text">Ledgers</span>
                <select v-model="range">
                    <option v-for="(option, index) in ranges" :value="option.value" :key="index">
                        {{ option.label }}
                    </option>
                </select>
            </div -->
            <!-- div class="input-group mb-2">
                <div class="form-check form-switch">
                    <input v-model="pause" v-on:click="handleChangePause" class="form-check-input" type="checkbox" role="switch" id="flexBloomPause" checked>
                    <label class="form-check-label text-white" for="flexBloomPause">Pause Data</label>
                </div>
            </div> -->
            <!-- <div class="col-2">
                <div class="input-group mb-2 text-light">
                    
                    <input v-model="fixed_index" type="email" class="form-control" id="fixedIndex" aria-describedby="fixedIndex">
                    <label for="fixedIndex" class="form-label ms-2">Ledger Index (optional)</label>
                </div>
            </div> -->
            
            <!-- div class="input-group mb-2">
                <div class="form-check form-switch">
                    <input v-model="success" v-on:click="handleSucess" class="form-check-input" type="checkbox" role="switch" id="flexSucessSwitch" checked>
                    <label class="form-check-label text-white" for="flexSucessSwitch">tesSUCCESS</label>
                </div>
            </div -->
            <!-- div class="input-group mb-2">
                <div class="form-check form-switch">
                    <input v-model="dimentions" v-on:click="handleChangDimentions" class="form-check-input" type="checkbox" role="switch" id="flexDimentionsSwitch" checked>
                    <label class="form-check-label text-white" for="flexDimentionsSwitch">2D/3D</label>
                </div>
            </div -->
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

            <!-- div class="input-group mb-5 text-white">
                <button type="button" class="btn btn-primary" v-on:click="handleFetch" :disabled="ledger === undefined || loading">{{ loading ? 'Rendering':'Render'}}</button>
            </div-->
            
            <div class="row text-light">
                <p><i class="bi bi-circle-fill" style="color: #ffa500;"></i> Bridge</p>
            </div>
            <div v-if="network === 'xrpl'" class="row text-light">
                <p><i class="bi bi-circle-fill" style="color: #FF1A8B;"></i> AMM</p>
            </div>

            <div v-if="network === 'xahau'" class="row text-light">
                <p><i class="bi bi-circle-fill" style="color: #1c37e7;"></i> Import</p>
            </div>
            <div class="row text-light">
                <p><i class="bi bi-circle-fill" style="color: #1c9ce7;"></i> AccountSet</p>
            </div>
            
            <div class="row text-light">
                <p><i class="bi bi-circle-fill" style="color: #00E56a;"></i> DEX Trade</p>
            </div>
            <div class="row text-light">
                <p><i class="bi bi-circle-fill" style="color: #974CFF;"></i> Direct Payment</p>
            </div>
            <div class="row text-light">
                <p><i class="bi bi-circle-fill" style="color: #FFFFFF;"></i> Rippling Payment</p>
            </div>
            <div class="row text-light">
                <p><i class="bi bi-circle-fill" style="color: #00FFFF;"></i> TrustSet</p>
            </div>
            <div v-if="network === 'xrpl'" class="row text-light">
                <p><i class="bi bi-circle-fill" style="color: #FFFF00;"></i> NFT</p>
            </div>
            <div v-if="network === 'xahau'" class="row text-light">
                <p><i class="bi bi-circle-fill" style="color: #FFFF00;"></i> URIToken, Remit</p>
            </div>
            <div v-if="network === 'xahau'" class="row text-light">
                <!-- <p><i class="bi bi-circle-fill" style="color: #FFA500;"></i> Invoke</p> -->
                <p><i class="bi bi-circle-fill" style="color: #FF1A8B;"></i> Invoke</p>
            </div>
        </div>
    </div>

    
    <div class="row"><div class="col text-center"><h1 v-if="rendered_label === undefined">{{ ledger }}</h1> <h1 v-if="rendered_label !== undefined">{{ rendered_label }}</h1><small class="text-white">accounts renderered: {{ Object.keys(this.accounts).length }}</small> <small class="text-white">ledgers: {{ ledgers }}</small></div></div>
    <div id="3d-graph"></div>
</template>

<script>
import ForceGraph3D from '3d-force-graph'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
// import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js'


// const glitchPass = new GlitchPass(64)
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
            fixed_index: undefined,
            rendered_label: undefined,
            reset: false,
            queue_size: 50,
            client: undefined,
            network: 'xrpl',
            dimentions: true,
            bloom_show: true,
            success: true,
            animation: 1200,
            range: 25,
            ranges: [
                { label: '10', value: 10 },
                { label: '25', value: 25 },
                { label: '50', value: 50 },
                { label: '75', value: 75 },
                { label: '100', value: 100 },
                { label: '150', value: 150 },
                { label: '200', value: 200 },
                { label: '250', value: 250 },
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
            loading: false,
            pausedRefill: [],
            time: undefined
        }
    },
    computed: {
    },
    
    async mounted() {
        console.log('loading...')
        this.graphAMMs()
        this.init()
    },
    methods: {
        async init() {
            this.graph = undefined
            this.graph = ForceGraph3D({
                controlType: 'trackball'// fly
            })

            // this.graph.forceEngine('ngraph')
            this.graph.warmupTicks(100)
            this.graph.cooldownTicks(0)

            (document.getElementById('3d-graph'))
                .backgroundColor('rgba(0,0,0,0)')
                .graphData({nodes: this.nodes, links: this.links})
                .nodeLabel('id')
                .nodeVal('size')
                .enableNodeDrag(false)
                .onNodeClick(node => window.open((this.network === 'xrpl') ? `https://livenet.xrpl.org/transactions/${node.hash}`:`https://xahau.xrpl.org/transactions/${node.hash}`, '_blank'))
            
            this.graph.postProcessingComposer().addPass(bloomPass)
        },
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
        handleSucess() {
            this.success = !this.success
        },
        handleChangDimentions() {
            (!this.dimentions) ? this.graph.numDimensions(3) : this.graph.numDimensions(2)
        },
        
        async handleFetch() {
            this.rendered_label = undefined
            this.loading = true
            this.nodes = []
            this.links = []
            this.graph.graphData({
                nodes: this.nodes,
                links: this.links
            })
            
            this.loading = false
        },

        async graphAMMs() {
            console.log('graphAMMs')
            const data = await this.axios.get('https://liquidity.panicbot.app/api/v1/liquidity').then(response => response.data)
            
            console.log('AMM data loaded')
            for (const [key, value] of Object.entries(data)) {
                if (key === 'time') {
                    console.log('updating time', value)
                    this.time = value
                    continue
                }
                value.key = key
                console.log(value.asset1.currency, value.asset2.currency, value.asset1.issuer, value.asset2.issuer)
                this.nodes.push({ id: value.asset2.issuer, group: 'AMM', color: '#1c9ce7', hash: value.asset2.currency, size: 1 })
                this.nodes.push({ id: value.asset1.issuer, group: 'AMM', color: '#1c9ce7', hash: value.asset1.currency, size: 1 })
                this.links.push({ source: value.asset1.issuer, target: value.asset2.issuer, group: 'AMM', hash: value.asset1.currency })

                // if (this.base_asset === value.asset2.currency) {
                //     if (!this.issuers.includes(value.asset2.issuer)) {
                //         this.issuers.push(value.asset2.issuer)
                //     }
                // }
                // else if (this.base_asset === value.asset1.currency) {
                //     if (!this.issuers.includes(value.asset1.issuer)) {
                //         this.issuers.push(value.asset1.issuer)
                //     }
                // }
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
                
                const group = type !== undefined ? type: element.isAMM ? 'AMM': element.isOffer ? 'DEX' : element.isDirect? 'DIRECT' : 'RIPPLING'
                // bit complicated here as there is a bug in .isOffer
                let color
                if (type === 'DEX') {
                    color = element.isAMM ? '#FF1A8B': '#00E56a'
                }
                else {
                    color = element.isAMM ? '#FF1A8B': element.isOffer ? '#00E56a' : element.isDirect? '#974CFF' : '#FFFFFF'
                }
                // teleport bridge
                if (element.account === 'rTeLeproT3BVgjWoYrDYpKbBLXPaVMkge') {
                    color = '#ffa500'
                }
                if (element.account === 'rEVRTELEpb16FQSGgK8GRJGy9ChviquddK') {
                    color = '#ffa500'
                }
                // axelar bridge
                if (element.account === 'rfmS3zqrQrka8wVyhXifEeyTwe8AMz2Yhw') {
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

                    this.nodes.push({ id: element.account, group: 'Payment', color, hash: transaction.hash, size: this.scaleValue(value) })
                }
                else {
                    // update colors to the latest other wise.
                    for (let index = 0; index < this.nodes.length; index++) {
                        const node = this.nodes[index]
                        if (node.id !== element.account) { continue }
                        if (node.color !== color && node.group !== 'AMM') {
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
                    this.links.push({ source: data.sourceAccount, target: element.account, group: 'Payment', hash: transaction.hash })
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

.graph-key {
    width: 10px;
    height: 20px;
    display: block;
    position: absolute;
    margin-left: 15px;
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
