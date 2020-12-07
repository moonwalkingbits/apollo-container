/*
 * Copyright (c) 2020 Martin Pettersson
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * A dependency injection (DI) container.
 *
 * A container instance lets you practise inversion of control (IoC) by
 * delegating the task of constructing new instances to the container.
 * Instances are resolved from the container without any knowledge about
 * creation of their dependencies. This decouples the objects from each other
 * and makes the dependency tree clear.
 */
class Container {
    /**
     * Create a new container instance.
     *
     * @public
     */
    constructor() {
        /**
         * Set of registered bindings.
         *
         * A binding is a definition of how to create an object and an
         * identifier for that object within the container.
         *
         * @private
         * @type {Map.<string, {factory: Function, singleton: boolean}>}
         */
        this.bindings = new Map();

        /**
         * Set of concrete object instances.
         *
         * @private
         * @type {Map.<string, *>}
         */
        this.instances = new Map();

        /**
         * Set of aliases for bindings or instances.
         *
         * @private
         * @type {Map.<string, string>}
         */
        this.aliases = new Map();
    }

    /**
     * Determine if the container has a binding for the given identifier.
     *
     * @public
     * @param {string} identifier Binding identifier.
     * @return {boolean} True if a binding exists.
     */
    has(identifier) {
        return this.bindings.has(identifier) ||
               this.instances.has(identifier) ||
               this.aliases.has(identifier);
    }

    /**
     * Retrieve an object.
     *
     * @public
     * @param {string} identifier Identifier of the object.
     * @return {*} Object matching the identifier.
     */
    get(identifier) {
        if (!this.has(identifier)) {
            throw new Error(`Unknown identifier: ${identifier}`);
        }

        identifier = this.resolveIdentifier(identifier);

        if (this.instances.has(identifier)) {
            return this.instances.get(identifier);
        }

        const { factory, singleton } = this.bindings.get(identifier);
        const value = this.invoke(factory);

        if (singleton) {
            this.createSingletonFromBinding(identifier, value);
        }

        return value;
    }

    /**
     * Construct a new object instance injecting any resolvable dependencies.
     *
     * @public
     * @param {Function} constructor Object constructor.
     * @param {?Object.<string, *>} parameters Any named parameters to pass to the constructor.
     * @return {*} Object instance.
     */
    construct(constructor, parameters = {}) {
        return Reflect.construct(
            constructor,
            this.resolveParameters(this.extractParameterNames(this.firstExplicitConstructor(constructor)), parameters)
        );
    }

    /**
     * Invoke function injecting any resolvable dependencies.
     *
     * If the given function is bound we don't have access to the original
     * function signature. This makes it impossible to extract the functions
     * parameters. In this case you can pass the original function as a
     * parameter and we will extract the parameters from that signature.
     *
     * @public
     * @param {Function} func Function to be invoked.
     * @param {?Object.<string, *>} parameters Any named parameters to pass to the function.
     * @param {?Function} signature Original function signature in case the function is bound.
     * @return {*} Whatever the invoked function returns.
     */
    invoke(func, parameters = {}, signature = null) {
        return func.apply(func, this.resolveParameters(this.extractParameterNames(signature ?? func), parameters));
    }

    /**
     * Register a concrete object instance to the container.
     *
     * @public
     * @param {string} identifier Object identifier.
     * @param {*} instance Concrete object instance.
     */
    bindInstance(identifier, instance) {
        this.instances.set(identifier, instance);
    }

    /**
     * Registers a constructor to the container.
     *
     * @public
     * @param {string} identifier Constructor identifier.
     * @param {Function} constructor Object constructor.
     * @param {?boolean} singleton Whether this binding is a singleton.
     */
    bindConstructor(identifier, constructor, singleton = false) {
        this.bindings.set(identifier, {
            factory: () => this.construct(constructor),
            singleton
        });
    }

    /**
     * Registers an object factory to the container.
     *
     * @public
     * @param {string} identifier Factory identifier.
     * @param {Function} factory Object factory.
     * @param {?boolean} singleton Whether this binding is a singleton.
     */
    bindFactory(identifier, factory, singleton = false) {
        this.bindings.set(identifier, {
            factory,
            singleton
        });
    }

    /**
     * Make sure the binding is a singleton.
     *
     * @public
     * @param {string} identifier Binding identifier.
     */
    makeSingleton(identifier) {
        if (!this.has(identifier)) {
            throw new Error(`Unknown identifier: ${identifier}`);
        }

        identifier = this.resolveIdentifier(identifier);

        if (this.instances.has(identifier)) {
            return;
        }

        this.bindings.get(identifier).singleton = true;
    }

    /**
     * Create a binding alias.
     *
     * @public
     * @param {string} identifier Binding identifier.
     * @param {string} alias Binding alias.
     */
    alias(identifier, alias) {
        while (this.aliases.has(identifier)) {
            identifier = this.aliases.get(identifier);
        }

        this.aliases.set(alias, identifier);
    }

    /**
     * Resolve binding identifier.
     *
     * In case the identifier is an alias the original binding identifier is
     * resolved.
     *
     * @private
     * @param {string} identifier Binding identifier.
     * @return {string} Original binding identifier.
     */
    resolveIdentifier(identifier) {
        return this.aliases.get(identifier) || identifier;
    }

    /**
     * Ensure the binding is a singleton.
     *
     * @private
     * @param {string} identifier Binding identifier.
     * @param {*} value Concrete object instance.
     */
    createSingletonFromBinding(identifier, value) {
        this.instances.set(identifier, value);
        this.bindings.delete(identifier);
    }

    /**
     * Extracts the names of the parameters in the target signature.
     *
     * @private
     * @param {Function} target Function signature.
     * @return {Array.<string>} List of parameter names.
     */
    extractParameterNames(target) {
        const captureGroups = [
            // Matches class constructor arguments.
            "^class .*?constructor\\((.*?)\\)",

            // Matches instance methods.
            "^.*?\\((.*?)\\)",

            // Matches a single arrow function argument without any parentheses.
            "^(?:async )?(.*?) ?=>",

            // Matches arrow function arguments within parentheses.
            "^\\((.*?)\\) ?=>",

            // Matches function arguments.
            "^function.*?\\((.*?)\\)"
        ];
        const parameterMatch = target.toString()
            .match(new RegExp(captureGroups.join("|"), "ms"));

        if (!parameterMatch) {
            return [];
        }

        const parameterString = parameterMatch.slice(1)
            .reduce((defaultValue, match) => match || defaultValue, "");

        return parameterString
            // Remove line comments.
            .replace(/\/\/.*$/gm, "")
            // Remove block comments.
            .replace(/\/\*.*?\*\//gm, "")
            // Remove whitespace.
            .replace(/\s/gm, "")
            // Remove any enclosing parentheses
            .replace(/^\(|\)$/, "")
            // Remove default values.
            .replace(/=.*?(?=,|$)/g, "")
            .split(",");
    }

    /**
     * Resolve parameter values from the container.
     *
     * @private
     * @param {Array.<string>} parameterNames List of parameter names to find values for.
     * @param {Object.<string, *>} parameters Named parameters who takes precedence.
     * @return {Array.<*>} List of resolved values.
     */
    resolveParameters(parameterNames, parameters) {
        return parameterNames.map(name => this.resolveParameter(name, parameters));
    }

    /**
     * Resolve parameter value from the container.
     *
     * @private
     * @param {string} name Parameter name.
     * @param {Object.<string, *>} parameters Named parameters who takes precedence.
     * @return {*} Resolved value.
     */
    resolveParameter(name, parameters) {
        if (name in parameters) {
            return parameters[name];
        }

        if (this.has(name)) {
            return this.get(name);
        }

        // NOTE: Even if the parameter doesn't have a default value in the
        //       signature the parameter could still be assigned a value in the
        //       function/constructor itself. Therefore we probably shouldn't
        //       throw an exception here.
        //
        //       This could perhaps be configured in the future if there's a
        //       desire to be really strict about this. But for now it would
        //       probably break a lot of existing libraries.
        return;
    }

    /**
     * Finds and returns the first explicit constructor in the prototype chain.
     *
     * @private
     * @param {Function} constructor Constructor to start searching from.
     * @return {Function} First explicit constructor in the prototype chain.
     */
    firstExplicitConstructor(constructor) {
        let parentConstructor = constructor;

        while (parentConstructor !== Object.getPrototypeOf(Object)) {
            if (/^class .*?constructor\((.*?)\)/ms.test(parentConstructor.toString())) {
                return parentConstructor;
            }

            parentConstructor = Object.getPrototypeOf(parentConstructor);
        }

        return constructor;
    }
}

export default Container;
