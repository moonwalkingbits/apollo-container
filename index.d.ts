/*
 * Copyright (c) 2020 Martin Pettersson
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

type Constructor<T = any> = new (...parameters: Array<any>) => T;
type Function<T = any> = (...parameters: Array<any>) => T;
type NamedParameters = {[name: string]: any};

/**
 * An interface representing a dependency injection (DI) container.
 *
 * A container instance lets you practise inversion of control (IoC) by
 * delegating the task of constructing new instances to the container.
 * Instances are resolved from the container without any knowledge about
 * creation of their dependencies. This decouples the objects from each other
 * and makes the dependency tree clear.
 */
declare interface ContainerInterface {
    /**
     * Determine if the container has a binding for the given name.
     *
     * @param identifier Binding identifier.
     * @return True if a binding exists.
     */
    has(identifier: string): boolean;

    /**
     * Retrieve an object.
     *
     * @param identifier Identifier of the object.
     * @return Object matching the identifier.
     */
    get<T = any>(identifier: string): T;

    /**
     * Construct a new object instance injecting any resolvable dependencies.
     *
     * @param constructor Object constructor.
     * @param parameters Any named parameters to pass to the constructor.
     * @return Object instance.
     */
    construct<T = any>(constructor: Constructor<T>, parameters?: NamedParameters): T;

    /**
     * Invoke function injecting any resolvable dependencies.
     *
     * If the given function is bound we don't have access to the original
     * function signature. This makes it impossible to extract the functions
     * parameters. In this case you can pass the original function as a
     * parameter and we will extract the parameters from that signature.
     *
     * @param func Function to be invoked.
     * @param parameters Any named parameters to pass to the function.
     * @param signature Original function signature in case the function is bound.
     * @return Whatever the invoked function returns.
     */
    invoke<T = any>(func: Function<T>, parameters?: NamedParameters, signature?: Function<T>): T;

    /**
     * Register a concrete object instance to the container.
     *
     * @param identifier Object identifier.
     * @param instance Concrete object instance.
     */
    bindInstance(identifier: string, instance: any): void;

    /**
     * Registers a constructor to the container.
     *
     * @param identifier Constructor identifier.
     * @param constructor Object constructor.
     * @param singleton Whether this binding is a singleton.
     */
    bindConstructor(identifier: string, constructor: Constructor, singleton?: boolean): void;

    /**
     * Registers an object factory to the container.
     *
     * @param identifier Factory identifier.
     * @param factory Object factory.
     * @param singleton Whether this binding is a singleton.
     */
    bindFactory(identifier: string, factory: Function, singleton?: boolean): void;

    /**
     * Make sure the binding is a singleton.
     *
     * @param identifier Binding identifier.
     */
    makeSingleton(identifier: string): void;

    /**
     * Create a binding alias.
     *
     * @param identifier Binding identifier.
     * @param alias Binding alias.
     */
    alias(identifier: string, alias: string): void;
}

/**
 * A dependency injection (DI) container.
 *
 * A container instance lets you practise inversion of control (IoC) by
 * delegating the task of constructing new instances to the container.
 * Instances are resolved from the container without any knowledge about
 * creation of their dependencies. This decouples the objects from each other
 * and makes the dependency tree clear.
 */
declare class Container implements ContainerInterface {
    /**
     * Create a new container instance.
     */
    public constructor();

    /**
     * Determine if the container has a binding for the given name.
     *
     * @param identifier Binding identifier.
     * @return True if a binding exists.
     */
    public has(identifier: string): boolean;

    /**
     * Retrieve an object.
     *
     * @param identifier Identifier of the object.
     * @return Object matching the identifier.
     */
    public get<T = any>(identifier: string): T;

    /**
     * Construct a new object instance injecting any resolvable dependencies.
     *
     * @param constructor Object constructor.
     * @param parameters Any named parameters to pass to the constructor.
     * @return Object instance.
     */
    public construct<T = any>(constructor: Constructor<T>, parameters?: NamedParameters): T;

    /**
     * Invoke function injecting any resolvable dependencies.
     *
     * If the given function is bound we don't have access to the original
     * function signature. This makes it impossible to extract the functions
     * parameters. In this case you can pass the original function as a
     * parameter and we will extract the parameters from that signature.
     *
     * @param func Function to be invoked.
     * @param parameters Any named parameters to pass to the function.
     * @param signature Original function signature in case the function is bound.
     * @return Whatever the invoked function returns.
     */
    public invoke<T = any>(func: Function<T>, parameters?: NamedParameters, signature?: Function<T>): T;

    /**
     * Register a concrete object instance to the container.
     *
     * @param identifier Object identifier.
     * @param instance Concrete object instance.
     */
    public bindInstance(identifier: string, instance: any): void;

    /**
     * Registers a constructor to the container.
     *
     * @param identifier Constructor identifier.
     * @param constructor Object constructor.
     * @param singleton Whether this binding is a singleton.
     */
    public bindConstructor(identifier: string, constructor: Constructor, singleton?: boolean): void;

    /**
     * Registers an object factory to the container.
     *
     * @param identifier Factory identifier.
     * @param factory Object factory.
     * @param singleton Whether this binding is a singleton.
     */
    public bindFactory(identifier: string, factory: Function, singleton?: boolean): void;

    /**
     * Make sure the binding is a singleton.
     *
     * @param identifier Binding identifier.
     */
    public makeSingleton(identifier: string): void;

    /**
     * Create a binding alias.
     *
     * @param identifier Binding identifier.
     * @param alias Binding alias.
     */
    public alias(identifier: string, alias: string): void;
}

export { Container, ContainerInterface };
