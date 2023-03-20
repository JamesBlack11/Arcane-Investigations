
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.57.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Header.svelte generated by Svelte v3.57.0 */
    const file$7 = "src/Header.svelte";

    function create_fragment$7(ctx) {
    	let header;
    	let div3;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let span0;
    	let t2;
    	let div2;
    	let span1;
    	let t4;
    	let span2;
    	let t6;
    	let span3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			header = element("header");
    			div3 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "Arcane Investigations";
    			t2 = space();
    			div2 = element("div");
    			span1 = element("span");
    			span1.textContent = "About";
    			t4 = space();
    			span2 = element("span");
    			span2.textContent = "Services";
    			t6 = space();
    			span3 = element("span");
    			span3.textContent = "Contact";
    			if (!src_url_equal(img.src, img_src_value = "./Arcane-logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "height", "80");
    			attr_dev(img, "width", "80");
    			add_location(img, file$7, 130, 12, 6121);
    			attr_dev(div0, "class", "logo");
    			add_location(div0, file$7, 129, 8, 6090);
    			attr_dev(span0, "class", "text-cyan-400 font-semibold cursor-pointer");
    			attr_dev(span0, "data-target", "home");
    			set_style(span0, "font-family", "'Poppins', sans-serif");
    			add_location(span0, file$7, 133, 12, 6251);
    			attr_dev(div1, "class", "flex-grow hidden sm:block");
    			add_location(div1, file$7, 132, 8, 6199);
    			attr_dev(span1, "class", "text-cyan-400 mx-1 sm:mx-4 cursor-pointer");
    			attr_dev(span1, "data-target", "about");
    			set_style(span1, "font-family", "'Poppins', sans-serif");
    			add_location(span1, file$7, 136, 12, 6474);
    			attr_dev(span2, "class", "text-cyan-400 mx-1 sm:mx-4 cursor-pointer");
    			attr_dev(span2, "data-target", "services");
    			set_style(span2, "font-family", "'Poppins', sans-serif");
    			add_location(span2, file$7, 137, 12, 6639);
    			attr_dev(span3, "class", "text-cyan-400 mx-1 sm:mx-4 cursor-pointer");
    			attr_dev(span3, "data-target", "contact");
    			set_style(span3, "font-family", "'Poppins', sans-serif");
    			add_location(span3, file$7, 138, 12, 6810);
    			attr_dev(div2, "class", "flex");
    			add_location(div2, file$7, 135, 8, 6443);
    			attr_dev(div3, "id", "menu-bar");
    			attr_dev(div3, "class", "menu-bar bg-gray-800 w-full h-20 flex items-center px-4 svelte-ydql1l");
    			add_location(div3, file$7, 128, 4, 5998);
    			add_location(header, file$7, 127, 0, 5985);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div3);
    			append_dev(div3, div0);
    			append_dev(div0, img);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, span0);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, span1);
    			append_dev(div2, t4);
    			append_dev(div2, span2);
    			append_dev(div2, t6);
    			append_dev(div2, span3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", scrollTo$2, false, false, false, false),
    					listen_dev(span1, "click", scrollTo$2, false, false, false, false),
    					listen_dev(span2, "click", scrollTo$2, false, false, false, false),
    					listen_dev(span3, "click", scrollTo$2, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function scrollTo$2(event) {
    	const targetId = event.currentTarget.getAttribute('data-target');
    	const targetElement = document.getElementById(targetId);

    	if (targetElement) {
    		targetElement.scrollIntoView({ behavior: 'smooth' });
    	}
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);

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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ scrollTo: scrollTo$2, onMount });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Hero.svelte generated by Svelte v3.57.0 */

    const file$6 = "src/Hero.svelte";

    function create_fragment$6(ctx) {
    	let section;
    	let div1;
    	let div0;
    	let h1;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Arcane Investigations";
    			attr_dev(h1, "class", "text-4xl sm:text-5xl md:text-7xl font-extrabold mb-4 font-roboto");
    			set_style(h1, "font-family", "'Poppins', sans-serif");
    			add_location(h1, file$6, 46, 12, 1797);
    			attr_dev(div0, "class", "text-center");
    			add_location(div0, file$6, 45, 8, 1759);
    			attr_dev(div1, "class", "container mx-auto px-4");
    			add_location(div1, file$6, 44, 4, 1714);
    			attr_dev(section, "class", "hero-section svelte-1rf1obo");
    			add_location(section, file$6, 43, 0, 1679);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Hero', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Hero> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Hero extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hero",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/AboutUs.svelte generated by Svelte v3.57.0 */

    const file$5 = "src/AboutUs.svelte";

    function create_fragment$5(ctx) {
    	let section;
    	let div0;
    	let h2;
    	let t1;
    	let div2;
    	let div1;
    	let h30;
    	let t3;
    	let p0;
    	let t5;
    	let div4;
    	let div3;
    	let h31;
    	let t7;
    	let p1;
    	let t9;
    	let div6;
    	let div5;
    	let h32;
    	let t11;
    	let p2;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Investigative Services & Consulting";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Who We Are";
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "Arcane Investigations is a professional private investigation firm based in Philadelphia. We specialize in providing discreet, high-quality services to clients in the Philadelphia, New Jersey, and Delaware areas. Our team of experienced investigators is dedicated to uncovering the truth and helping our clients get the answers they need.";
    			t5 = space();
    			div4 = element("div");
    			div3 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Our Services";
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "We offer a wide range of investigative services, including surveillance, background checks, infidelity investigations, fraud investigations, asset searches, and more. Our thorough and methodical approach ensures that we leave no stone unturned in our pursuit of the truth.";
    			t9 = space();
    			div6 = element("div");
    			div5 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Why Choose Us";
    			t11 = space();
    			p2 = element("p");
    			p2.textContent = "At Arcane Investigations, we pride ourselves on our commitment to client satisfaction. We understand that each case is unique, which is why we work closely with our clients to develop a customized strategy that will meet their specific needs. With our extensive experience and unparalleled attention to detail, you can trust Arcane Investigations to deliver results.";
    			attr_dev(h2, "class", "about-title svelte-tc7k14");
    			set_style(h2, "font-family", "'Poppins', sans-serif");
    			add_location(h2, file$5, 67, 8, 2861);
    			attr_dev(div0, "class", "title text-center text-3xl p-5  svelte-tc7k14");
    			add_location(div0, file$5, 66, 4, 2806);
    			attr_dev(h30, "id", "who");
    			attr_dev(h30, "class", "text-2xl font-bold mb-2 svelte-tc7k14");
    			set_style(h30, "font-family", "'Poppins', sans-serif");
    			add_location(h30, file$5, 71, 12, 3066);
    			attr_dev(p0, "class", "about-text svelte-tc7k14");
    			add_location(p0, file$5, 72, 12, 3182);
    			attr_dev(div1, "class", "w-full px-4");
    			add_location(div1, file$5, 70, 8, 3028);
    			attr_dev(div2, "class", "section-container p-5 svelte-tc7k14");
    			add_location(div2, file$5, 69, 4, 2984);
    			attr_dev(h31, "id", "Our");
    			attr_dev(h31, "class", "text-2xl font-bold mb-2 svelte-tc7k14");
    			set_style(h31, "font-family", "'Poppins', sans-serif");
    			add_location(h31, file$5, 79, 12, 3689);
    			attr_dev(p1, "class", "about-text svelte-tc7k14");
    			add_location(p1, file$5, 80, 12, 3807);
    			attr_dev(div3, "class", "w-full px-4");
    			add_location(div3, file$5, 78, 8, 3651);
    			attr_dev(div4, "class", "section-container p-5 svelte-tc7k14");
    			add_location(div4, file$5, 77, 4, 3607);
    			attr_dev(h32, "id", "Why");
    			attr_dev(h32, "class", "text-2xl font-bold mb-2 svelte-tc7k14");
    			set_style(h32, "font-family", "'Poppins', sans-serif");
    			add_location(h32, file$5, 87, 12, 4248);
    			attr_dev(p2, "class", "about-text svelte-tc7k14");
    			add_location(p2, file$5, 88, 12, 4367);
    			attr_dev(div5, "class", "w-full px-4");
    			add_location(div5, file$5, 86, 8, 4210);
    			attr_dev(div6, "class", "section-container p-5 svelte-tc7k14");
    			add_location(div6, file$5, 85, 4, 4166);
    			attr_dev(section, "id", "about-us");
    			attr_dev(section, "class", "container mx-auto px-4 svelte-tc7k14");
    			add_location(section, file$5, 65, 0, 2747);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, h2);
    			append_dev(section, t1);
    			append_dev(section, div2);
    			append_dev(div2, div1);
    			append_dev(div1, h30);
    			append_dev(div1, t3);
    			append_dev(div1, p0);
    			append_dev(section, t5);
    			append_dev(section, div4);
    			append_dev(div4, div3);
    			append_dev(div3, h31);
    			append_dev(div3, t7);
    			append_dev(div3, p1);
    			append_dev(section, t9);
    			append_dev(section, div6);
    			append_dev(div6, div5);
    			append_dev(div5, h32);
    			append_dev(div5, t11);
    			append_dev(div5, p2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AboutUs', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AboutUs> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class AboutUs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AboutUs",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/About.svelte generated by Svelte v3.57.0 */
    const file$4 = "src/About.svelte";

    function create_fragment$4(ctx) {
    	let section;
    	let aboutus;
    	let current;
    	aboutus = new AboutUs({ $$inline: true });

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(aboutus.$$.fragment);
    			attr_dev(section, "id", "about");
    			add_location(section, file$4, 5, 0, 112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(aboutus, section, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(aboutus.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(aboutus.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(aboutus);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ContactForm: AboutUs, AboutUs });
    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }

    var _ = {
      $(selector) {
        if (typeof selector === "string") {
          return document.querySelector(selector);
        }
        return selector;
      },
      extend(...args) {
        return Object.assign(...args);
      },
      cumulativeOffset(element) {
        let top = 0;
        let left = 0;

        do {
          top += element.offsetTop || 0;
          left += element.offsetLeft || 0;
          element = element.offsetParent;
        } while (element);

        return {
          top: top,
          left: left
        };
      },
      directScroll(element) {
        return element && element !== document && element !== document.body;
      },
      scrollTop(element, value) {
        let inSetter = value !== undefined;
        if (this.directScroll(element)) {
          return inSetter ? (element.scrollTop = value) : element.scrollTop;
        } else {
          return inSetter
            ? (document.documentElement.scrollTop = document.body.scrollTop = value)
            : window.pageYOffset ||
                document.documentElement.scrollTop ||
                document.body.scrollTop ||
                0;
        }
      },
      scrollLeft(element, value) {
        let inSetter = value !== undefined;
        if (this.directScroll(element)) {
          return inSetter ? (element.scrollLeft = value) : element.scrollLeft;
        } else {
          return inSetter
            ? (document.documentElement.scrollLeft = document.body.scrollLeft = value)
            : window.pageXOffset ||
                document.documentElement.scrollLeft ||
                document.body.scrollLeft ||
                0;
        }
      }
    };

    const defaultOptions = {
      container: "body",
      duration: 500,
      delay: 0,
      offset: 0,
      easing: cubicInOut,
      onStart: noop,
      onDone: noop,
      onAborting: noop,
      scrollX: false,
      scrollY: true
    };

    const _scrollTo = options => {
      let {
        offset,
        duration,
        delay,
        easing,
        x=0,
        y=0,
        scrollX,
        scrollY,
        onStart,
        onDone,
        container,
        onAborting,
        element
      } = options;

      if (typeof offset === "function") {
        offset = offset();
      }

      var cumulativeOffsetContainer = _.cumulativeOffset(container);
      var cumulativeOffsetTarget = element
        ? _.cumulativeOffset(element)
        : { top: y, left: x };

      var initialX = _.scrollLeft(container);
      var initialY = _.scrollTop(container);

      var targetX =
        cumulativeOffsetTarget.left - cumulativeOffsetContainer.left + offset;
      var targetY =
        cumulativeOffsetTarget.top - cumulativeOffsetContainer.top + offset;

      var diffX = targetX - initialX;
    	var diffY = targetY - initialY;

      let scrolling = true;
      let started = false;
      let start_time = now() + delay;
      let end_time = start_time + duration;

      function scrollToTopLeft(element, top, left) {
        if (scrollX) _.scrollLeft(element, left);
        if (scrollY) _.scrollTop(element, top);
      }

      function start(delayStart) {
        if (!delayStart) {
          started = true;
          onStart(element, {x, y});
        }
      }

      function tick(progress) {
        scrollToTopLeft(
          container,
          initialY + diffY * progress,
          initialX + diffX * progress
        );
      }

      function stop() {
        scrolling = false;
      }

      loop(now => {
        if (!started && now >= start_time) {
          start(false);
        }

        if (started && now >= end_time) {
          tick(1);
          stop();
          onDone(element, {x, y});
        }

        if (!scrolling) {
          onAborting(element, {x, y});
          return false;
        }
        if (started) {
          const p = now - start_time;
          const t = 0 + 1 * easing(p / duration);
          tick(t);
        }

        return true;
      });

      start(delay);

      tick(0);

      return stop;
    };

    const proceedOptions = options => {
    	let opts = _.extend({}, defaultOptions, options);
      opts.container = _.$(opts.container);
      opts.element = _.$(opts.element);
      return opts;
    };

    const scrollTo$1 = options => {
      return _scrollTo(proceedOptions(options));
    };

    /* src/ContactForm.svelte generated by Svelte v3.57.0 */

    const { console: console_1 } = globals;
    const file$3 = "src/ContactForm.svelte";

    function create_fragment$3(ctx) {
    	let div7;
    	let div5;
    	let h1;
    	let t1;
    	let form;
    	let div3;
    	let div2;
    	let div0;
    	let input0;
    	let t2;
    	let div1;
    	let input1;
    	let t3;
    	let div4;
    	let textarea;
    	let t4;
    	let button;
    	let t6;
    	let div6;
    	let h2;
    	let t8;
    	let p0;
    	let i0;
    	let t9;
    	let t10;
    	let p1;
    	let t12;
    	let p2;
    	let i1;
    	let t13;
    	let t14;
    	let p3;
    	let i2;
    	let t15;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div5 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Contact Us Below";
    			t1 = space();
    			form = element("form");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t3 = space();
    			div4 = element("div");
    			textarea = element("textarea");
    			t4 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			t6 = space();
    			div6 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Contact Information";
    			t8 = space();
    			p0 = element("p");
    			i0 = element("i");
    			t9 = text(" Email: Arcaneinvestigationsllc@gmail.com");
    			t10 = space();
    			p1 = element("p");
    			p1.textContent = "Phone Number:";
    			t12 = space();
    			p2 = element("p");
    			i1 = element("i");
    			t13 = text("(215)-966-7580");
    			t14 = space();
    			p3 = element("p");
    			i2 = element("i");
    			t15 = text("(609)-405-1164");
    			attr_dev(h1, "class", "contact-us text-black text-2xl mb-6 text-center svelte-jwrxfz");
    			add_location(h1, file$3, 113, 8, 4164);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "name", "name");
    			attr_dev(input0, "class", "form-control w-full border-1 border-gray-300 bg-white p-2 mb-2");
    			attr_dev(input0, "placeholder", "Full Name");
    			input0.required = true;
    			add_location(input0, file$3, 118, 24, 4561);
    			attr_dev(div0, "class", "col w-full md:w-1/2");
    			add_location(div0, file$3, 117, 20, 4503);
    			attr_dev(input1, "type", "email");
    			attr_dev(input1, "name", "email");
    			attr_dev(input1, "class", "form-control w-full border-1 border-gray-300 bg-white p-2 mb-2");
    			attr_dev(input1, "placeholder", "Email Address");
    			input1.required = true;
    			add_location(input1, file$3, 121, 24, 4802);
    			attr_dev(div1, "class", "col w-full md:w-1/2");
    			add_location(div1, file$3, 120, 20, 4744);
    			attr_dev(div2, "class", "form-row flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4");
    			add_location(div2, file$3, 116, 16, 4398);
    			attr_dev(div3, "class", "form-group");
    			add_location(div3, file$3, 115, 12, 4357);
    			attr_dev(textarea, "placeholder", "How Can we Help?");
    			attr_dev(textarea, "class", "form-control w-full border-1 border-gray-300 bg-white p-2 mb-2");
    			attr_dev(textarea, "name", "message");
    			attr_dev(textarea, "rows", "10");
    			textarea.required = true;
    			add_location(textarea, file$3, 126, 16, 5066);
    			attr_dev(div4, "class", "form-group");
    			add_location(div4, file$3, 125, 12, 5025);
    			attr_dev(button, "id", "submit");
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-lg rounded-md bg-black text-black p-2 svelte-jwrxfz");
    			add_location(button, file$3, 128, 12, 5255);
    			attr_dev(form, "target", "_blank");
    			attr_dev(form, "action", "https://formsubmit.co/jschwartz374@gmail.com");
    			attr_dev(form, "method", "POST");
    			add_location(form, file$3, 114, 8, 4254);
    			attr_dev(div5, "class", "container max-w-md w-full mx-auto bg-cyan-500 p-6 bg-black rounded shadow-md md:w-1/2 p-4 mb-8 md:mb-0");
    			add_location(div5, file$3, 112, 4, 4039);
    			attr_dev(h2, "class", "p-5 mb-4");
    			add_location(h2, file$3, 132, 8, 5425);
    			attr_dev(i0, "class", "fas fa-envelope");
    			add_location(i0, file$3, 133, 23, 5494);
    			attr_dev(p0, "class", "p-5");
    			add_location(p0, file$3, 133, 8, 5479);
    			attr_dev(p1, "class", "p-5");
    			add_location(p1, file$3, 134, 8, 5580);
    			attr_dev(i1, "class", "fas fa-phone");
    			add_location(i1, file$3, 135, 23, 5636);
    			attr_dev(p2, "class", "p-5");
    			add_location(p2, file$3, 135, 8, 5621);
    			attr_dev(i2, "class", "fas fa-phone ");
    			add_location(i2, file$3, 136, 23, 5706);
    			attr_dev(p3, "class", "p-5");
    			add_location(p3, file$3, 136, 8, 5691);
    			attr_dev(div6, "class", "md:w-1/2 p-5");
    			add_location(div6, file$3, 131, 4, 5390);
    			attr_dev(div7, "id", "form");
    			attr_dev(div7, "class", "contact flex flex-col md:flex-row justify-center items-center min-h-screen  svelte-jwrxfz");
    			add_location(div7, file$3, 111, 0, 3935);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div5);
    			append_dev(div5, h1);
    			append_dev(div5, t1);
    			append_dev(div5, form);
    			append_dev(form, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, input0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, input1);
    			append_dev(form, t3);
    			append_dev(form, div4);
    			append_dev(div4, textarea);
    			append_dev(form, t4);
    			append_dev(form, button);
    			append_dev(div7, t6);
    			append_dev(div7, div6);
    			append_dev(div6, h2);
    			append_dev(div6, t8);
    			append_dev(div6, p0);
    			append_dev(p0, i0);
    			append_dev(p0, t9);
    			append_dev(div6, t10);
    			append_dev(div6, p1);
    			append_dev(div6, t12);
    			append_dev(div6, p2);
    			append_dev(p2, i1);
    			append_dev(p2, t13);
    			append_dev(div6, t14);
    			append_dev(div6, p3);
    			append_dev(p3, i2);
    			append_dev(p3, t15);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ContactForm', slots, []);
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
    		scrollTo$1({
    			element: document.querySelector('header'),
    			duration: 500
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<ContactForm> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		scrollTo: scrollTo$1,
    		name,
    		email,
    		message,
    		submitForm
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) name = $$props.name;
    		if ('email' in $$props) email = $$props.email;
    		if ('message' in $$props) message = $$props.message;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class ContactForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContactForm",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Contact.svelte generated by Svelte v3.57.0 */
    const file$2 = "src/Contact.svelte";

    function create_fragment$2(ctx) {
    	let section;
    	let contactform;
    	let current;
    	contactform = new ContactForm({ $$inline: true });

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(contactform.$$.fragment);
    			attr_dev(section, "id", "contact");
    			add_location(section, file$2, 4, 0, 72);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(contactform, section, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contactform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contactform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(contactform);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Contact', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ContactForm });
    	return [];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Footer.svelte generated by Svelte v3.57.0 */
    const file$1 = "src/Footer.svelte";

    function create_fragment$1(ctx) {
    	let footer;
    	let div3;
    	let div0;
    	let h2;
    	let t1;
    	let div1;
    	let span0;
    	let t3;
    	let span1;
    	let t5;
    	let span2;
    	let t7;
    	let div2;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div3 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Arcane Investigations";
    			t1 = space();
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "About";
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "Services";
    			t5 = space();
    			span2 = element("span");
    			span2.textContent = "Contact";
    			t7 = space();
    			div2 = element("div");
    			p = element("p");
    			p.textContent = `© ${/*currentYear*/ ctx[0]} Arcane Investigations. All rights reserved.`;
    			attr_dev(h2, "class", "footer-logo  svelte-1kzatt7");
    			add_location(h2, file$1, 58, 12, 1394);
    			attr_dev(div0, "class", "text-center");
    			add_location(div0, file$1, 57, 8, 1356);
    			attr_dev(span0, "class", "text-cyan-400 mx-2 cursor-pointer");
    			attr_dev(span0, "data-target", "about");
    			set_style(span0, "font-family", "'Poppins', sans-serif");
    			add_location(span0, file$1, 61, 12, 1500);
    			attr_dev(span1, "class", "text-cyan-400 mx-2 cursor-pointer");
    			attr_dev(span1, "data-target", "services");
    			set_style(span1, "font-family", "'Poppins', sans-serif");
    			add_location(span1, file$1, 62, 12, 1657);
    			attr_dev(span2, "class", "text-cyan-400 mx-2 cursor-pointer");
    			attr_dev(span2, "data-target", "contact");
    			set_style(span2, "font-family", "'Poppins', sans-serif");
    			add_location(span2, file$1, 63, 12, 1820);
    			attr_dev(div1, "class", "flex");
    			add_location(div1, file$1, 60, 8, 1469);
    			add_location(p, file$1, 66, 12, 2035);
    			attr_dev(div2, "class", "text-center mt-8");
    			add_location(div2, file$1, 65, 8, 1992);
    			attr_dev(div3, "class", "footer-container svelte-1kzatt7");
    			add_location(div3, file$1, 56, 4, 1317);
    			attr_dev(footer, "class", "footer svelte-1kzatt7");
    			add_location(footer, file$1, 55, 0, 1289);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h2);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t3);
    			append_dev(div1, span1);
    			append_dev(div1, t5);
    			append_dev(div1, span2);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, p);

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", scrollTo, false, false, false, false),
    					listen_dev(span1, "click", scrollTo, false, false, false, false),
    					listen_dev(span2, "click", scrollTo, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function scrollTo(event) {
    	const targetId = event.currentTarget.getAttribute('data-target');
    	const targetElement = document.getElementById(targetId);

    	if (targetElement) {
    		targetElement.scrollIntoView({ behavior: 'smooth' });
    	}
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	let currentYear = new Date().getFullYear();

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

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ currentYear, scrollTo, onMount });

    	$$self.$inject_state = $$props => {
    		if ('currentYear' in $$props) $$invalidate(0, currentYear = $$props.currentYear);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentYear];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.57.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div2;
    	let header;
    	let t0;
    	let hero;
    	let t1;
    	let div1;
    	let div0;
    	let about;
    	let t2;
    	let contact;
    	let t3;
    	let footer;
    	let current;
    	header = new Header({ $$inline: true });
    	hero = new Hero({ $$inline: true });
    	about = new About({ $$inline: true });
    	contact = new Contact({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			create_component(header.$$.fragment);
    			t0 = space();
    			create_component(hero.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			create_component(about.$$.fragment);
    			t2 = space();
    			create_component(contact.$$.fragment);
    			t3 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(div0, "class", "container mx-auto px-4 sm:px-6 lg:px-8 py-8");
    			add_location(div0, file, 75, 2, 1777);
    			attr_dev(div1, "class", "page-content svelte-d303dn");
    			add_location(div1, file, 74, 1, 1748);
    			attr_dev(div2, "class", "grid-bg min-h-screen svelte-d303dn");
    			add_location(div2, file, 70, 0, 1689);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			mount_component(header, div2, null);
    			append_dev(div2, t0);
    			mount_component(hero, div2, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(about, div0, null);
    			append_dev(div0, t2);
    			mount_component(contact, div0, null);
    			append_dev(div1, t3);
    			mount_component(footer, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(hero.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			transition_in(contact.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(hero.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			transition_out(contact.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(header);
    			destroy_component(hero);
    			destroy_component(about);
    			destroy_component(contact);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header, Hero, About, Contact, Footer });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
