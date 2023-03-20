
<!--<script>-->
<!--	import Header from "./Header.svelte";-->
<!--	import Hero from "./Hero.svelte";-->
<!--	import About from "./About.svelte";-->
<!--	import Contact from "./Contact.svelte";-->
<!--	import Footer from "./Footer.svelte";-->
<!--</script>-->

<!--<style>-->
<!--	.container {-->
<!--		width: 100%;-->

<!--		margin: 0 auto;-->
<!--		padding: 2em;-->
<!--		background-color: rgba(41, 41, 41, 90);-->
<!--		box-sizing: border-box;-->
<!--	}-->

<!--	.grid-bg {-->
<!--		background-image: linear-gradient(0deg, rgba(0, 0, 0, 0.7) .1em, transparent .1em),-->
<!--		linear-gradient(90deg, rgba(0, 0, 0, 0.7) .1em, transparent .1em);-->
<!--		background-size: .5em .5em;-->
<!--		background-color: rgba(41, 41, 41, 0.9);-->
<!--	}-->

<!--	.page-content {-->
<!--		min-height: 100vh;-->
<!--		display: flex;-->
<!--		flex-direction: column;-->

<!--	}-->
<!--</style>-->

<!--<div class="grid-bg min-h-screen">-->
<!--	<Header />-->
<!--	<Hero />-->


<!--<div class="page-content">-->
<!--	<div class="container">-->
<!--		<About />-->
<!--		<Contact />-->
<!--	</div>-->
<!--	<Footer />-->
<!--</div>-->
<!--</div>-->
<script>
	import Header from "./Header.svelte";
	import Hero from "./Hero.svelte";
	import About from "./About.svelte";
	import Contact from "./Contact.svelte";
	import Footer from "./Footer.svelte";
</script>

<style>
	.grid-bg {
		background-image: linear-gradient(0deg, rgba(0, 0, 0, 0.7) .1em, transparent .1em),
		linear-gradient(90deg, rgba(0, 0, 0, 0.7) .1em, transparent .1em);
		background-size: .5em .5em;
		background-color: rgba(41, 41, 41, 0.9);
	}

	.page-content {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
</style>

<div class="grid-bg min-h-screen">
	<Header />
	<Hero />

	<div class="page-content">
		<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<About />
			<Contact />
		</div>
		<Footer />
	</div>
</div>