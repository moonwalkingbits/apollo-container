/*
 * Copyright (c) 2020 Martin Pettersson
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { expectAssignable, expectError, expectType } from "tsd";

import { Container, ContainerInterface } from ".";

class A {}
function f1() {}
const f2 = (name: string) => name;

const container = new Container();

expectAssignable<ContainerInterface>(container);
expectType<boolean>(container.has("identifier"));
expectType<string>(container.get("identifier"));
expectType<A>(container.construct(A));
expectType<A>(container.construct(A, {name: "value"}));
expectType<void>(container.invoke(f1));
expectType<string>(container.invoke(f2, {name: "value"}));
expectType<string>(container.invoke(f2.bind(null), {name: "value"}, f2));
expectError(() => {
    expectType<string>(container.invoke(f2.bind(null), {name: "value"}, f1));
});
container.bindInstance("identifier", "value");
container.bindConstructor("identifier", A);
container.bindConstructor("identifier", A, true);
container.bindFactory("identifier", f1);
container.bindFactory("identifier", f2, true);
container.makeSingleton("identifier");
container.alias("identifier", "alias");
