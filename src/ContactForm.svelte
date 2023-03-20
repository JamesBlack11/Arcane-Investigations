<script>
    import { scrollTo } from 'svelte-scrollto';

    let name = '';
    let email = '';
    let message = '';

    function submitForm() {
        // Implement a function to send an email using your preferred method or back-end service
        console.log('Form submitted:', { name, email, message });

        // Clear form fields
        name = '';
        email = '';
        message = '';

        // Scroll back to the top of the page
        scrollTo({ element: document.querySelector('header'), duration: 500 });
    }
</script>
<!--<div class="flex justify-center items-center min-h-screen bg-white">-->
<!--    <div class="container flex justify-center items-center min-h-screen">-->
<!--        <h1 class="text-black">Contact Us Below!</h1>-->
<!--        <form class="flex justify-center items-center min-h-screen" target="_blank" action="https://formsubmit.co/jschwartz374@gmail.com" method="POST">-->
<!--            <div class="form-group">-->
<!--                <div class="form-row">-->
<!--                    <div class="col">-->
<!--                        <input type="text" name="name" class="form-control" placeholder="Full Name" required>-->
<!--                    </div>-->
<!--                    <div class="col">-->
<!--                        <input type="email" name="email" class="form-control" placeholder="Email Address" required>-->
<!--                    </div>-->
<!--                </div>-->
<!--            </div>-->
<!--            <div class="form-group">-->
<!--                <textarea placeholder="Your Message" class="form-control" name="message" rows="10" required></textarea>-->
<!--            </div>-->
<!--            <button type="submit" class="btn btn-lg btn-dark btn-block">Submit Form</button>-->
<!--        </form>-->
<!--    </div>-->
<!--</div>-->
<style>
    @import 'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.16/tailwind.min.css';

    .contact{
        color: #999999;
    }
    .btn{
        color: #2BA4A0;
    }
    .contact-us{
        color: #2BA4A0;
    }
    #form{
        color: #2BA4A0;
    }
    #submit{
        background-color: #fffffff;
    }
</style>

<div id="form" class="contact flex justify-center items-center min-h-screen ">
    <div class="container max-w-md w-full mx-auto bg-cyan-500 p-6 bg-black rounded shadow-md md:w-1/2 p-4">
        <h1 class="contact-us text-black text-2xl mb-6 text-center">Contact Us Below</h1>
        <form target="_blank" action="https://formsubmit.co/jschwartz374@gmail.com" method="POST">
            <div class="form-group">
                <div class="form-row flex space-x-4">
                    <div class="col w-1/2">
                        <input type="text" name="name" class="form-control w-full border-1 border-gray-300 bg-white p-2 mb-2" placeholder="Full Name" required>
                    </div>
                    <div class="col w-1/2">
                        <input type="email" name="email" class="form-control w-full border-1 border-gray-300 bg-white p-2 mb-2" placeholder="Email Address" required>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <textarea placeholder="How Can we Help?" class="form-control w-full border-1 border-gray-300 bg-white p-2 mb-2" name="message" rows="10" required></textarea>
            </div>
            <button id="submit" type="submit" class="btn btn-lg rounded-md bg-black text-black p-2">Submit</button>
        </form>
    </div>
    <div class="md:w-1/2 p-5">
        <h2 class="p-5 mb-4">Contact Information</h2>
        <p class="p-5"><i class="fas fa-envelope"> </i> Email: Arcaneinvestigationsllc@gmail.com</p>
        <p class="p-5">Phone Number:</p>
        <p class="p-5"><i class="fas fa-phone"></i>(215)-966-7580</p>
        <p class="p-5"><i class="fas fa-phone "></i>(609)-405-1164</p>
    </div>
</div>