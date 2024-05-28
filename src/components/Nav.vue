<template>
    <!-- <header class="header" id="header">
        <div class="header_toggle"> <i class='bx bx-menu' id="header-toggle"></i> </div>
        <div class="header_img"> <img src="https://placehold.co/40x40" alt=""> </div>
    </header>
    <div class="l-navbar" id="nav-bar">
        <nav class="navbar">
            <div>
                <a href="#" class="nav_logo"> 
                    <i class='bi bi-hdd-stack-fill'></i> <span class="nav_logo-name">Swap</span> 
                </a>
            </div> 
            <a @click="logout" v-if="$store.getters.getSignedIn" class="nav_link"> <i class='bx bx-log-out nav_icon'></i> <span class="nav_name">SignOut</span> </a>
        </nav>
    </div> -->
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { routes as rts } from '../router'

export default {
    data() {
            return {
            }
    },
    setup() {
        const routes = rts

        const router = useRouter()
        const activeRoute = computed(() => router.currentRoute.value.path)
        const isActive = (path) => path === activeRoute.value
        const path = activeRoute.value
        const pathName = computed(() => router.currentRoute.value.name)

        return { isActive, routes, path, pathName}
    },
    mounted() {
        const showNavbar = (toggleId, navId, bodyId, headerId) => {
                const toggle = document.getElementById(toggleId),
                nav = document.getElementById(navId),
                bodypd = document.getElementById(bodyId),
                headerpd = document.getElementById(headerId)
                // Validate that all variables exist
                if(toggle && nav && bodypd && headerpd){
                    toggle.addEventListener('click', ()=>{
                        // show navbar
                        nav.classList.toggle('show-nav')
                        // change icon
                        toggle.classList.toggle('bx-x')
                        // add padding to body
                        bodypd.classList.toggle('body-pd')
                        // add padding to header
                        headerpd.classList.toggle('body-pd')
                    })
                }
            }

            showNavbar('header-toggle','nav-bar','mybod','header')

            /*===== LINK ACTIVE =====*/
            const linkColor = document.querySelectorAll('.nav_link')

            function colorLink(){
                if(linkColor){
                    linkColor.forEach(l=> l.classList.remove('active'))
                    this.classList.add('active')
                }
            }
            linkColor.forEach(l=> l.addEventListener('click', colorLink))
    },
    methods: {
        logout() {
            console.log('user logged out')
            this.$store.dispatch('clearStorage', true)
            this.$router.go()
        }
    }
}
</script>

<style lang="scss" scoped>
    .nav_logo {
        color: #fff;
        cursor: default;
    }
</style>
