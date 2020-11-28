/*
 * Copyright (c) 2020 Martin Pettersson
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Container } from "@moonwalkingbits/apollo-container";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { expect } = require("chai");

describe("Container", () => {
    let container;

    beforeEach(() => {
        container = new Container();
    });

    describe("#has()", () => {
        it("should determine if named item is not bound", () => {
            expect(container.has("name")).to.be.false;
        });

        it("should determine if a named instance is bound", () => {
            container.bindInstance("name", "value");

            expect(container.has("name")).to.be.true;
        });

        it("should determine if a named constructor is bound", () => {
            container.bindConstructor("name", Container);

            expect(container.has("name")).to.be.true;
        });

        it("should determine if a named factory is bound", () => {
            container.bindFactory("name", () => "value");

            expect(container.has("name")).to.be.true;
        });

        it("should determine if an item is bound by an alias", () => {
            container.bindInstance("name", "value");
            container.alias("name", "alias");

            expect(container.has("alias")).to.be.true;
        });

        it("should determine if an item is bound by a nested alias", () => {
            container.bindInstance("name", "value");
            container.alias("name", "alias");
            container.alias("alias", "secondAlias");

            expect(container.has("secondAlias")).to.be.true;
        });
    });

    describe("#get()", () => {
        it("should throw an error if binding is not found", () => {
            expect(() => container.get("name")).to.throw();
        });

        it("should resolve a named binding", () => {
            const value = "value";
            container.bindFactory("name", () => value);

            expect(container.get("name")).to.equal(value);
        });

        it("should resolve a named instance", () => {
            const value = "value";
            container.bindInstance("name", value);

            expect(container.get("name")).to.equal(value);
        });

        it("should resolve an instance bound by an alias", () => {
            const value = "value";
            container.bindInstance("name", value);
            container.alias("name", "alias");

            expect(container.get("alias")).to.equal(value);
        });

        it("should resolve an instance bound by a nested alias", () => {
            const value = "value";
            container.bindInstance("name", value);
            container.alias("name", "alias");
            container.alias("alias", "secondAlias");

            expect(container.get("secondAlias")).to.equal(value);
        });
    });

    describe("#bindInstance", () => {
        it("should bind an instance value to the container", () => {
            const value = "value";
            container.bindInstance("name", value);

            expect(container.get("name")).to.equal(value);
        });

        it("should return the same instance every time", () => {
            const value = ["value"];
            container.bindInstance("name", value);

            expect(container.get("name")).to.equal(value);
            expect(container.get("name")).to.equal(value);
        });
    });

    describe("#bindConstructor", () => {
        class A {}

        it("should bind a constructor to the container", () => {
            container.bindConstructor("name", A);

            expect(container.get("name")).to.be.an.instanceof(A);
        });

        it("should invoke the constructor every time", () => {
            container.bindConstructor("name", A);

            expect(container.get("name")).not.to.equal(container.get("name"));
        });

        it("should create singleton if desired", () => {
            container.bindConstructor("name", A, true);

            expect(container.get("name")).to.equal(container.get("name"));
        });
    });

    describe("#bindFactory", () => {
        it("should bind a factory to the container", () => {
            const value = "value";
            container.bindFactory("name", () => value);

            expect(container.get("name")).to.equal(value);
        });

        it("should invoke the factory every time", () => {
            let value = 0;
            container.bindFactory("name", () => ++value);

            expect(container.get("name")).to.equal(1);
            expect(container.get("name")).to.equal(2);
        });

        it("should create singleton if desired", () => {
            let value = 0;
            container.bindFactory("name", () => ++value, true);

            expect(container.get("name")).to.equal(1);
            expect(container.get("name")).to.equal(1);
        });
    });

    describe("#makeSingleton", () => {
        it("should make value a singleton", () => {
            let value = 0;
            container.bindFactory("name", () => ++value);
            container.makeSingleton("name");

            expect(container.get("name")).to.equal(1);
            expect(container.get("name")).to.equal(1);
        });

        it("should throw an error if no binding is found", () => {
            expect(() => container.makeSingleton("name")).to.throw();
        });

        it("should not throw an error if binding is already a singleton", () => {
            let value = 0;
            container.bindInstance("name", ++value);
            container.makeSingleton("name");

            expect(container.get("name")).to.equal(1);
            expect(container.get("name")).to.equal(1);
        });
    });

    describe("#alias", () => {
        it("should create an alias", () => {
            container.bindInstance("name", "value");
            container.alias("name", "alias");

            expect(container.has("alias")).to.equal(true);
        });

        it("should create a nested alias", () => {
            container.bindInstance("name", "value");
            container.alias("name", "alias");
            container.alias("alias", "nestedAlias");

            expect(container.has("nestedAlias")).to.equal(true);
        });
    });

    describe("#construct", () => {
        class A {}
        class B { constructor(a) { this.a = a } }
        class C { constructor(b) { this.b = b } }

        it("should construct an instance without arguments", () => {
            expect(container.construct(A)).to.be.an.instanceof(A);
        });

        it("should resolve dependency by name if bound", () => {
            container.bindConstructor("a", A);

            expect(container.construct(B).a).to.be.an.instanceof(A);
        });

        it("should recursively resolve dependencies by name if bound", () => {
            container.bindConstructor("a", A);
            container.bindConstructor("b", B);

            const c = container.construct(C);

            expect(c.b).to.be.an.instanceof(B);
            expect(c.b.a).to.be.an.instanceof(A);
        });

        it("should use provided parameters", () => {
            const b = new B(new A());
            const c = container.construct(C, {b});

            expect(c.b).to.equal(b);
        });

        it("should use provided parameters over bindings", () => {
            container.bindConstructor("a", A);
            container.bindConstructor("b", B);

            const b = new B(new A());
            const c = container.construct(C, {b});

            expect(c.b).to.equal(b);
        });

        it("should not throw error if no parameters are found, eg. regexp fails", () => {
            class A {}
            A.toString = () => "";

            container.bindConstructor("a", A);

            expect(container.get("a")).to.be.an.instanceof(A);
        });

        it("should not throw exception if dependency is not found", () => {
            container.bindConstructor("b", B);

            const c = container.construct(C);

            expect(c.b).to.be.an.instanceof(B);
            expect(c.b.a).to.be.undefined;
        });
    });

    describe("#invoke", () => {
        const a = () => "a";
        const b = a => `${a}b`;

        it("should invoke a function without arguments", () => {
            expect(container.invoke(a)).to.equal("a");
        });

        it("should invoke a function with single parameter without parentheses", () => {
            container.bindInstance("a", "a");

            expect(container.invoke(a => `${a}b`)).to.equal("ab");
        });

        it("should resolve dependency by name if bound", () => {
            container.bindInstance("a", "a");

            expect(container.invoke(b)).to.equal("ab");
        });

        it("should use provided parameters", () => {
            expect(container.invoke(b, {a: "a"})).to.equal("ab");
        });

        it("should use provided parameters over bindings", () => {
            container.bindInstance("a", "c");

            expect(container.invoke(b, {a: "a"})).to.equal("ab");
        });

        it("should not throw error if no parameters are found, eg. regexp fails", () => {
            const a = () => "a";
            a.toString = () => "";

            expect(container.invoke(a)).to.equal("a");
        });

        it("should not throw exception if dependency is not found", () => {
            expect(container.invoke(b)).to.equal("undefinedb");
        });

        it("should use provided parameters over default values", () => {
            const a = (x = "default value", y = "test") => x;

            expect(container.invoke(a, {x: "value"})).to.equal("value");
        });

        it("should resolve parameters for instance methods", () => {
            class B {
                method(a) {
                    return `${a}b`;
                }
            }

            container.bindInstance("a", "a");

            expect(container.invoke(new B().method)).to.equal("ab");
        });

        it("should accept unbound function to extract parameters from when invoking a bound function", () => {
            container.bindInstance("a", "a");

            expect(container.invoke(b.bind(a), {}, b)).to.equal("ab");
        });

        it("should ignore parameter comments", () => {
            const x = "value";
            const a = (/* x = "default value" */) => x;

            expect(container.invoke(a)).to.equal("value");
        });
    });
});
