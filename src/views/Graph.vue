<template>
    <div class="row">
        <div class="col ms-5 mt-5">
            <div class="input-group mb-2">
                <div class="form-check form-switch">
                    <input v-model="bloom_show" v-on:click="handleChangeBloom" class="form-check-input" type="checkbox" role="switch" id="flexBloomSwitch" checked>
                    <label class="form-check-label text-white" for="flexBloomSwitch">Bloom Pass</label>
                </div>
            </div>
        </div>
    </div>
    <div class="row"><div class="col text-center"><small class="text-white">AMM pools: {{ nodes.length }}</small> <small class="text-white">links: {{ links.length }}</small></div></div>
    <div v-if="!loaded" class="spinner-border" role="status"></div>
    <div id="amm-graph"></div>
    <section>
            <div id="data-feed-overlay">
                <div id="amm-data-feed">
                    <div class="feed-header">SWAPS</div>
                    <ul class="interaction">
                        <li v-for="item in amm">
                            <span v-if="item.ledger !== undefined">----- leder: {{ item.ledger }}</span>
                            <div  class="tx-group" v-if="item.ledger === undefined">
                                <div v-for="tx in item.txs">
                                    <span class="exchange" :style="'color: ' + tx.color"></span> <span class="info" :style="'color: ' + tx.color">  {{tx.amount}} {{tx.currency}}</span>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
    </section>
</template>

<script>
import { XrplClient } from 'xrpl-client'
import ForceGraph3D from '3d-force-graph'
import pathParser from 'xrpl-tx-path-parser'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

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
            mode: null,
            mode_last: null,
            modes: [
                { label: 'standard', value: null },
                { label: 'radialout', value: 'radialout' },
                { label: 'radialin', value: 'radialin' },
                // { label: 'zin', value: 'zin' },
                // { label: 'zout', value: 'zout' }
            ],
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
            amm: [],
            pairs: [],
            nodes: [],
            links: [],
            ledgers: 0,
            loading: false,
            time: undefined,
            client: undefined
        }
    },
    computed: {
    },
    
    async mounted() {
        console.log('loading...')
        this.listenLedgers()
        this.graphAMMs()
    },
    methods: {
        handleChangeMode(event) {
            console.log('changing mode', this.mode)

            if (this.mode_last !== this.mode) {
                this.mode_last = this.mode
                this.graph.dagMode(this.mode) 
            }
        },
        async init() {
            this.graph = undefined
            this.graph = ForceGraph3D({
                controlType: 'trackball'// fly
            })

            // this.graph.forceEngine('ngraph')
            this.graph.warmupTicks(100)
            this.graph.cooldownTicks(0)

            (document.getElementById('amm-graph'))
                .backgroundColor('rgba(0,0,0,0)')
                .graphData({nodes: this.nodes, links: this.links})
                .nodeLabel('id')
                .nodeOpacity(0.5)
                .nodeVal('size')
                .enableNodeDrag(false)
                .linkOpacity(0.2)
                .linkDirectionalParticleColor(() => 'cyan')
                .linkDirectionalParticleWidth(3)
                .onNodeClick(node => window.open(`https://threexrp.dev/liquidity?asset=${node.asset}&issuer=${node.issuer}`, '_blank'))
            
            this.graph.postProcessingComposer().addPass(bloomPass)
            this.graph.dagMode(this.mode)
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
        handleSucess() {
            this.success = !this.success
        },
        handleChangDimentions() {
            (!this.dimentions) ? this.graph.numDimensions(3) : this.graph.numDimensions(2)
        },
        async pause(milliseconds = 1000) {
            return new Promise(resolve => {
                // console.log('pausing....')
                setTimeout(resolve, milliseconds)
            })
        },
        insert_feed(data, tx_index) {
            if (data.length < 1) { return }
            const txs = []
            data.forEach(balance => {
                const color = (balance.currency === 'XRP') ? '#974CFF' : '#FFFFFF'
                txs.unshift({ 
                    currency: this.currencyHexToUTF8(balance.currency),
                    amount: this.numeralFormat(balance.value, '0,0[.]0000'),
                    color
                })    
            })
            this.amm.unshift({
                txs
            })
            
            while (this.amm.length > 100){ this.amm.pop() }
        },
        listenLedgers() {
            const xrpl = new XrplClient(['wss://xrpl1admin.panicbot.app', 'wss://xrpl2admin.panicbot.app'])
            const self = this
            xrpl.send({
				id: 'sequencer-' + name,
				command: 'subscribe',
				streams: ['ledger']
			})
            xrpl.on('ledger', async (event) => {
                console.log('ledger close')
                const request = {
                    'id': 'xrpl-local',
                    'command': 'ledger',
                    'ledger_hash': event.ledger_hash,
                    'ledger_index': 'validated',
                    'transactions': true,
                    'expand': true,
                    'owner_funds': true
                }
                const ledger_result = await xrpl.send(request)
                if ('error' in ledger_result) { return }


                const transactions = ledger_result?.ledger?.transactions
                for (let i = 0; i < transactions.length; i++) {
                    const transaction = transactions[i]
                    if (transaction.metaData.TransactionResult !== 'tesSUCCESS') { continue }
                    transaction.meta  = transaction.metaData
                    // console.log('transaction', transaction)
                    try {
                        const data = pathParser(transaction)
                        if (data.accountBalanceChanges !== undefined && data.accountBalanceChanges.length > 0) {
                            for (let index = 0; index < data.accountBalanceChanges.length; index++) {
                                const change = data.accountBalanceChanges[index]
                                if (!change.isAMM) { continue }
                                // console.log('AMM affffected', change)
                                self.paymentParticle(change)
                                self.insert_feed(change.balances, i)
                            }
                        }    
                    } catch (error) {
                        //console.log('error parsing path', error)
                    }
                }
                this.amm.unshift({
                    ledger: ledger_result.ledger_index,
                })
            })
        },
        paymentParticle(change) {
            // if (!(change.balances.length >= 2)) { return }

            const asset1 = this.currencyHexToUTF8(change.balances[0].currency)
            const asset2 = this.currencyHexToUTF8(change.balances[1].currency)

            const pair1 = (asset1 === 'XRP') ? asset1 : asset1 + ':' + change.balances[0].issuer
            const pair2 = (asset2 === 'XRP') ? asset2 : asset2 + ':' + change.balances[1].issuer
            const self = this
            this.links.forEach(link => {

                if ((link.source.id === pair1 && link.target.id === pair2) || (link.source.id === pair2 && link.target.id === pair1)) {
                    self.graph.emitParticle(link)
                    console.log('animating particle', link)
                }
            })
        },
        async fetchLedger(index) {
            console.log('fetching ledger', index)
            let request = {
                'id': 'xrpl-local',
                'command': 'ledger',
                'ledger_index': index,
                'transactions': true,
                'expand': true,
                'owner_funds': true
            }
            this.client = this.$store.getters.getClient(this.network)
            const ledger_result = await this.client.send(request)
            // console.log('ledger_result', ledger_result)
            if ('error' in ledger_result) { return }
        },
        async graphAMMs() {
            console.log('graphAMMs')
            this.loading = true
            const data = await this.axios.get('https://liquidity.panicbot.app/api/v1/liquidity').then(response => response.data)
            
            // this.nodes.push({ id: 'XRP', group: 'XRP', color:'#FF1A8B', hash: 'XRP', size: 5 })
            
            console.log('AMM data parsing...')
            

            const allNodes = []
            const allLinks = []
            for (const [key, value] of Object.entries(data)) {

                if (key === 'time') {
                    console.log('updating time', value)
                    this.time = value
                    continue
                }
                if (value.AMM.liquidity === null) {
                    continue
                }

                const asset1 = this.currencyHexToUTF8(value.asset1.currency)
                const asset2 = this.currencyHexToUTF8(value.asset2.currency)

                const pair1 = (asset1 === 'XRP') ? asset1 + ':' + value.asset2.issuer : asset1 + ':' + value.asset1.issuer
                const pair2 = (asset2 === 'XRP') ? asset2 + ':' + value.asset1.issuer : asset2 + ':' + value.asset2.issuer
                let size = 1

                if (asset1 === 'XRP'){
                    size = this.scaleValue(value.AMM.liquidity.amount1 / 1_000_000)
                    // console.log('size', size, value.AMM.liquidity.amount1 / 1_000_000, value.AMM.liquidity)
                } 
                if (asset2 === 'XRP'){
                    size = this.scaleValue(value.AMM.liquidity.amount2 / 1_000_000)
                }

                if (asset1 === 'XRP' && value.AMM.pool === 'rBNUvT7EpjKFdihyj5X5jmAsscwqtV7Po7') {
                    console.log('size', size, value.AMM.liquidity.amount1 / 1_000_000, value.AMM.liquidity)
                }

                if (asset2 === 'XRP' && value.AMM.pool === 'rBNUvT7EpjKFdihyj5X5jmAsscwqtV7Po7') {
                    console.log('size', size, value.AMM.liquidity.amount2 / 1_000_000, value.AMM.liquidity)
                }
                let color = '#FF1A8B'
                if (size <= 1) {
                    color = '#FF1A8B'
                }
                else if (size <= 10) {
                    color = '#974CFF'
                }
                else if (size <= 50) {
                    color = '#ffa500'
                }
                else if (size <= 100) {
                    color = '#00E56a'
                }
                else if (size <= 500) {
                    color = '#1c9ce7'
                }
                //00FFFF
                
                if (!this.pairs.includes(pair1) && (asset1 === 'XRP' || asset2=== 'XRP' )) {
                    this.pairs.push(pair1)
                    allNodes.push({ id: pair1, asset: value.asset1.currency, issuer: value.asset1.issuer, color: pair1.split(':')[0] === 'XRP' ? '#FF1A8B' :color, pool: value.AMM.pool, size })
                }
                else if (!this.pairs.includes(pair2) && (asset1 === 'XRP' || asset2=== 'XRP' )) {
                    this.pairs.push(pair2)
                    allNodes.push({ id: pair2, asset: value.asset2.currency, issuer: value.asset2.issuer, color: pair2.split(':')[0] === 'XRP' ? '#FF1A8B' :color, pool: value.AMM.pool, size })
                }
                else if (!this.pairs.includes(pair1) && (asset1 === 'XRP' && asset2=== 'XRP' )) {
                    this.pairs.push(pair1)
                    allNodes.push({ id: pair1, asset: value.asset1.currency, issuer: value.asset1.issuer, color: pair1.split(':')[0] === 'XRP' ? '#FF1A8B' :color, pool: value.AMM.pool, size })
                }
                else if (!this.pairs.includes(pair2) && (asset1 !== 'XRP' && asset2=== 'XRP' )) {
                    this.pairs.push(pair2)
                    allNodes.push({ id: pair2, asset: value.asset2.currency, issuer: value.asset2.issuer, color: pair2.split(':')[0] === 'XRP' ? '#FF1A8B' :color, pool: value.AMM.pool, size })
                }

                if (pair1.split(':')[0] === 'XRP') {
                    allLinks.push({ source: pair1, target: pair2, pool: value.AMM.pool, particleWidth: 5 })
                }
                else {
                    allLinks.push({ source: pair2, target: pair1, pool: value.AMM.pool, particleWidth: 5})
                }
            }

            console.log('filtering nodes and links...')
            //now filter the nodes with to those with more than 2 links
            const nodeLinkCounts = {}
            allLinks.forEach(link => {
                nodeLinkCounts[link.source] = (nodeLinkCounts[link.source] || 0) + 1
                nodeLinkCounts[link.target] = (nodeLinkCounts[link.target] || 0) + 1
            })
            console.log('nodeLinkCounts', nodeLinkCounts)
            
            this.nodes = allNodes.filter(node => nodeLinkCounts[node.id] >= 2)
            console.log('nodes', this.nodes)
            const filteredNodeIds = new Set(this.nodes.map(node => node.id))
            this.links = allLinks.filter(link => 
                filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
            )
            console.log('links', this.links)
            this.init()

            console.log('AMM data loaded')
            this.loading = false
        },
        scaleValue(value) {
            
            if (value < 7_000) { return 0.1 }
            if (value < 10_000) { return 2 }
            if (value < 20_000) { return 3 }
            if (value < 30_000) { return 4 }
            if (value < 40_000) { return 5 }
            if (value < 50_000) { return 6 }
            if (value < 60_000) { return 7 }
            if (value < 70_000) { return 8 }
            if (value < 80_000) { return 9 }
            if (value < 90_000) { return 10 }
            if (value < 100_000) { return 11 }
            if (value < 200_000) { return 12 }
            if (value < 300_000) { return 13 }
            if (value < 400_000) { return 14 }
            if (value < 500_000) { return 15 }
            if (value < 600_000) { return 16 }
            if (value < 700_000) { return 17 }
            if (value < 800_000) { return 18 }
            if (value < 900_000) { return 19 }

            if (value < 1_000_000) { return 40 }
            if (value < 10_000_000) { return 80 }
            if (value < 100_000_000) { return 100 }
            if (value < 1_000_000_000) { return 200 }
        },
        scaleLinks(value) {
            if (value < 1) { return 1 }
            if (value < 2) { return 2 }
            if (value < 4) { return 5 }
            if (value < 8) { return 12 }
            if (value < 16) { return 40 }
            if (value < 32) { return 60 }
            if (value < 64) { return 70 }
            if (value < 128) { return 80 }
            if (value < 256) { return 100 }
            if (value < 512) { return 500 }
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
.tx-group {
    margin-bottom: 0.25rem;
    background-color: rgba(255, 255, 255, 0.1);
}

#amm-graph {
    position: absolute;
}

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

#data-feed-overlay.disabled {
    display: none;
}
#data-feed-overlay {
    position: relative;
    width: 100%;
    opacity: 100%;
    transition:opacity 1s;
    .form-check-label {
        right: -1000px;
        position: absolute;
    }
}

 #amm-data-feed {
    top: auto; 
    height: 100%;
    margin-top: 1rem;
    position: relative;
    background-color: rgb(255, 255, 255, 0.05);
    width: 185px;
    overflow: hidden;
    .feed-header {
        font-size: 1.2rem;
        text-align: center;
        margin-bottom: 1rem;
        color: #ffffff;
    }
    .feed-header-info {
        font-size: 0.8rem;
    }
    ul {
        list-style: none;
        padding: 0;
    }
    .interaction {
        font-size: 0.5rem;

    }
    padding: 1rem;
}

#amm-data-feed {
    text-align: left;
    float: right;
}




@media (min-width: 992px) {
    #amm-data-feed {
        width: 250px;
        top: 0;
        display: block;
    }
}
</style>
