<!-- Footer.svelte -->
<script>
    let currentYear = new Date().getFullYear();


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


<style>
    .footer {
        @apply bg-gray-800 text-white py-8;
        color: #b75b00;
        font-size: 17px;
    }

    .footer-container {
        @apply container mx-auto px-4;
    }

    .footer-logo {
        @apply text-2xl font-semibold mb-4;
    }

</style>

<footer class="footer">
    <div class="footer-container">
        <div class="text-center">
            <h2 class="footer-logo ">Arcane Investigations</h2>
        </div>
        <div class="flex">
            <span class="text-cyan-400 mx-2 cursor-pointer" data-target="about" on:click={scrollTo} style="font-family: 'Poppins', sans-serif;">About</span>
            <span class="text-cyan-400 mx-2 cursor-pointer" data-target="services" on:click={scrollTo} style="font-family: 'Poppins', sans-serif;">Services</span>
            <span class="text-cyan-400 mx-2 cursor-pointer" data-target="contact" on:click={scrollTo} style="font-family: 'Poppins', sans-serif;">Contact</span>
        </div>
        <div class="text-center mt-8">
            <p>&copy; {currentYear} Arcane Investigations. All rights reserved.</p>
        </div>
    </div>
</footer>