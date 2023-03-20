
    <script>
        function scrollTo(event) {
        const targetId = event.currentTarget.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
    }
    }
        import { onMount } from "svelte";

        onMount(() => {
            const menuBar = document.getElementById("menu-bar");

            function handleScroll() {
                // Customize this value according to the desired scrolling distance
                const scrollThreshold = 10;

                if (window.scrollY >= scrollThreshold) {
                    menuBar.style.transform = `translateY(${window.scrollY - scrollThreshold}px)`;
                } else {
                    menuBar.style.transform = "translateY(0)";
                }
            }

            window.addEventListener("scroll", handleScroll);

            return () => {
                window.removeEventListener("scroll", handleScroll);
            };
        });
</script>
<!--<style>-->
<!--    @import 'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.16/tailwind.min.css';-->
<!--</style>-->

<!--<header>-->

<!--    <div id="menu-bar" class="menu-bar bg-gray-800 w-full h-12 flex items-center px-4">-->
<!--        <div class="logo">-->
<!--            <img src="arcane-investigations-logo.png"  />-->
<!--        </div>-->
<!--        <div class="flex-grow">-->
<!--            <span class="text-slate-500 font-semibold cursor-pointer" data-target="home" on:click={scrollTo}>Arcane Investigations</span>-->
<!--        </div>-->
<!--        <div class="flex">-->
<!--            <span class="text-white mx-4 cursor-pointer" data-target="about" on:click={scrollTo}>About</span>-->
<!--            <span class="text-white mx-4 cursor-pointer" data-target="services" on:click={scrollTo}>Services</span>-->
<!--            <span class="text-white mx-4 cursor-pointer" data-target="contact" on:click={scrollTo}>Contact</span>-->
<!--        </div>-->
<!--    </div>-->
<!--</header>-->
    <style>
        @import 'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.16/tailwind.min.css';

        /* Add this style block to include the most popular font, currently Poppins */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap');
        .menu-bar{
            color: #2BA4A0;
        }

    </style>

    <header>
        <div id="menu-bar" class="menu-bar bg-gray-800 w-full h-20 flex items-center px-4">
            <div class="logo">
                <img src="./Arcane-logo.png" height="80" width="80"/>

               </div>
            <div class="flex-grow">
                <span class="text-cyan-400 font-semibold cursor-pointer" data-target="home" on:click={scrollTo} style="font-family: 'Poppins', sans-serif;">Arcane Investigations</span>
            </div>
            <div class="flex">
                <span class="text-cyan-400 mx-4 cursor-pointer" data-target="about" on:click={scrollTo} style="font-family: 'Poppins', sans-serif;">About</span>
                <span class="text-cyan-400 mx-4 cursor-pointer" data-target="services" on:click={scrollTo} style="font-family: 'Poppins', sans-serif;">Services</span>
                <span class="text-cyan-400 mx-4 cursor-pointer" data-target="contact" on:click={scrollTo} style="font-family: 'Poppins', sans-serif;">Contact</span>
            </div>
        </div>
    </header>