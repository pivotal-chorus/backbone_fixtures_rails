describe("rspecFixtures", function() {
    describe("nested fixture definitions", function() {
        var definition, model;

        beforeEach(function() {
            definition = {
                model:   "User",
                    unique:  [ "id" ],

                    children: {
                    noOverrides: {},
                    withOverrides: { model: "Workspace" }
                }
            };
        });

        it("gets the right data", function() {
            model = rspecFixtures.test.withOverrides();
            var fixtureScript = $("#fixtures [data-fixture-path='rspec/test/withOverrides']");
            console.log(fixtureScript.html());
            var fixtureJson = JSON.parse(fixtureScript.html());
            expect(model.get("first_name")).toBeDefined();
            expect(model.get("first_name")).toBe(fixtureJson.first_name);
        });

        it("caches the json data in a nested structure", function() {
            model = rspecFixtures.test.withOverrides();
            expect(window.rspecFixtures.parsedJson.test.withOverrides).toBeDefined();
        });

        describe("when the nested definition overrides the parent definition", function() {
            it("uses the values in the nested definition", function() {
                model = rspecFixtures.test.withOverrides();
                expect(definition.children.withOverrides.model).toBe("Workspace");
                expect(model instanceof models.Workspace).toBe(true);
            });
        });

        describe("when the nested definition does not override the parent definition", function() {
            it("uses the values in the parent definition", function() {
                model = rspecFixtures.test.noOverrides();
                expect(definition.model).toBe("User");
                expect(model instanceof models.User).toBe(true);
            });
        });
    });

    describe("user", function() {
        var user;

        beforeEach(function() {
            user = rspecFixtures.user();
        });

        it("includes the user fixture data", function() {
            expect(window.rspecFixtures.parsedJson.user).toBeDefined();
            expect(window.rspecFixtures.parsedJson.user.username).toBeDefined();
            expect(user.get("username")).toBe(window.rspecFixtures.parsedJson.user.username);
        });

        it("allows for overrides", function() {
            user = rspecFixtures.user({username: "Foo Bar"});
            expect(user.get("username")).toBe("Foo Bar");
        });

        it("allows camel-case attribute names for overrides", function() {
            user = rspecFixtures.user({ first_name: "Foo" });
            expect(user.get("first_name")).toBe("Foo");
        });

        it("does not allow overrides for non-existant attributes", function() {
            expect(function() { rspecFixtures.user({ foo: "Bar" }); }).toThrow();
        });

        it("gives each user a unique id", function() {
            var user2 = rspecFixtures.user();
            expect(user2.get("id")).not.toEqual(user.get("id"));
        });

        it("uses the override id, if one is specified", function() {
            var user2 = rspecFixtures.user({ id: '501' });
            expect(user2.get("id")).toBe("501");
        });
    });

    describe("#userJson", function() {
        var userJson;

        describe("when no overrides are passed", function() {
            beforeEach(function() {
                userJson = rspecFixtures.userJson();
            });

            it("returns the user fixture data", function() {
                expect(window.rspecFixtures.parsedJson.user).toBeDefined();
                expect(window.rspecFixtures.parsedJson.user.first_name).toBeDefined();
                expect(userJson.first_name).toBe(window.rspecFixtures.parsedJson.user.first_name);
            });

            it("clones the user fixture data", function() {
                expect(userJson).not.toBe(window.rspecFixtures.parsedJson.user);
            });
        });

        describe("when overrides are passed", function() {
            beforeEach(function() {
                userJson = rspecFixtures.userJson({ first_name: "vini" });
            });

            it("uses the overridden parameters", function() {
                expect(userJson.first_name).toBe("vini");
            });
        });
    });

    describe("#userSet", function() {
        var userSet;

        beforeEach(function() {
            userSet = rspecFixtures.userSet();
        });

        it("should create a UserSet collection", function() {
            expect(userSet instanceof collections.UserSet).toBe(true);
        });

        it("sets attributes of the models based on the fixture data", function() {
            var data = window.rspecFixtures.parsedJson.userSet[0];
            expect(data).toBeDefined();
            expect(data.username).toBeDefined();
            expect(userSet.at(0).get("username")).toBe(data.username);
        });

        it("allows for overrides", function() {
            userSet = rspecFixtures.userSet([ { username: "Foo Bar" } ]);
            expect(userSet.at(0).get("username")).toBe("Foo Bar");
        });

        it("does not allow overrides for non-existant attributes", function() {
            expect(function() {
                rspecFixtures.userSet([ { foo: "Bar" } ]);
            }).toThrow();
        });

        it("gives each user a unique id", function() {
            var userSet2 = rspecFixtures.userSet();
            var ids = [
                userSet.at(0).id,
                userSet.at(1).id,
                userSet2.at(0).id,
                userSet2.at(1).id
            ];
            expect(_.uniq(ids).length).toBe(4);
        });

        it("uses the override id, if one is specified", function() {
            var userSet2 = rspecFixtures.userSet([ { id: '501' } ]);
            expect(userSet2.at(0).get("id")).toBe("501");
        });
    });

    describe("#addUniqueDefaults(attributes, nameStrings)", function() {
        describe("when given an object", function() {
            var attributes1, attributes2;

            describe("when the object already contains the attributes specified as unique", function() {
                beforeEach(function() {
                    attributes1 = {
                        id: "101",
                        name: "foo",
                        workspace: {
                            workspaceId: "102",
                            name: "Bums",
                            sandbox: {
                                sandboxId: null,
                                name: "data-land"
                            }
                        }
                    };

                    rspecFixtures.addUniqueDefaults(attributes1, [ "id", "workspace.workspaceId", "workspace.sandbox.sandboxId" ]);
                });

                it("does not change the properties (even if they are null)", function() {
                    expect(attributes1).toEqual({
                        id: "101",
                        name: "foo",
                        workspace: {
                            workspaceId: "102",
                            name: "Bums",
                            sandbox: {
                                sandboxId: null,
                                name: "data-land"
                            }
                        }
                    });
                });
            });

            describe("when the object does not contain the attributes specified as unique", function() {
                beforeEach(function() {
                    attributes1 = {
                        name: "foo",
                        workspace: {
                            name: "Bums",
                            sandbox: {
                                name: "data-land"
                            }
                        }
                    };

                    attributes2 = _.clone(attributes1);
                    attributes2.workspace = _.clone(attributes1.workspace);
                    attributes2.workspace.sandbox = _.clone(attributes1.workspace.sandbox);

                    rspecFixtures.addUniqueDefaults(attributes1, [ "id", "workspace.workspaceId", "workspace.sandbox.sandboxId" ]);
                    rspecFixtures.addUniqueDefaults(attributes2, [ "id", "workspace.workspaceId", "workspace.sandbox.sandboxId" ]);
                });

                it("gives the object unique values for those attributes", function() {
                    expect(attributes1.id).toBeDefined();
                    expect(attributes1.id).not.toEqual(attributes2.id);
                    expect(attributes1.workspace.workspaceId).not.toEqual(attributes2.workspace.workspaceId);
                    expect(attributes1.workspace.sandbox.sandboxId).not.toEqual(attributes2.workspace.sandbox.sandboxId);
                });

                it("leaves the object's other properties as they were", function() {
                    expect(attributes1.name).toBe("foo");
                    expect(attributes1.workspace.name).toBe("Bums");
                    expect(attributes1.workspace.sandbox.name).toBe("data-land");
                });
            });

            describe("when the object does not have one of the nested objects specified in the unique list", function() {
                it("creates the nested object and the unique id inside of it", function() {
                    attributes1 = { name: "foo" };
                    attributes2 = { name: "foo" };
                    rspecFixtures.addUniqueDefaults(attributes1, [ "workspace.sandbox.id" ]);
                    rspecFixtures.addUniqueDefaults(attributes2, [ "workspace.sandbox.id" ]);
                    expect(attributes1.workspace.sandbox.id).not.toEqual(attributes2.workspace.sandbox.id);
                });
            });
        });

        describe("when given an array", function() {
            var attrArray1, attrArray2;

            beforeEach(function() {
                attrArray1 = [
                    {
                        name: "roger"
                    },
                    {
                        name: "anton",
                        workspace: {
                            name: "the kewl kids club"
                        }
                    }
                ];

                attrArray2 = _.clone(attrArray1);
                attrArray2[0] = _.clone(attrArray1[0]);
                attrArray2[1] = _.clone(attrArray1[1]);
                attrArray2[1].workspace = _.clone(attrArray1[1].workspace);
            });

            it("it adds the unique attribute values to each object in the array", function() {
                rspecFixtures.addUniqueDefaults(attrArray1, [ "id", "workspace.id" ]);
                rspecFixtures.addUniqueDefaults(attrArray2, [ "id", "workspace.id" ]);

                var ids = [
                    attrArray1[0].id,
                    attrArray1[1].id,
                    attrArray1[1].workspace.id,
                    attrArray2[0].id,
                    attrArray2[1].id,
                    attrArray2[1].workspace.id
                ];

                expect(_.uniq(ids).length).toBe(6);
            });
        });
    });

    describe("#safeExtend", function() {
        var result, original;

        beforeEach(function() {
            original = {
                foo: "bar",
                baz: "quux",
                nestedObjectArray: [
                    {
                        name: "ryan",
                        id: 3
                    },
                    {
                        name: "bleicke",
                        id: 4
                    }
                ],
                nestedStringArray: [
                    "Bob", "Jim", "Jim-Bob"
                ],
                nestedObject: {
                    name: "joe",
                    id: 5
                }
            };
        });

        describe("when no overrides are specified", function() {
            it("returns the original", function() {
                var result = rspecFixtures.safeExtend(original, undefined);
                expect(result).toEqual(original);
            });
        });

        describe("when a property is overriden", function() {
            beforeEach(function() {
                result = rspecFixtures.safeExtend(original, { foo: "pizza" });
            });

            it("uses the override", function() {
                expect(result.foo).toBe("pizza");
            });

            it("preserves the other keys in the original object", function() {
                expect(result.baz).toBe("quux");
            });

            describe("when the overrides contain a key that is not present in the original object", function() {
                it("throws an exception containing the specified name", function() {
                    expect(function() {
                        rspecFixtures.safeExtend(original, { whippedCream: "lots" }, "user");
                    }).toThrow("The fixture 'user' has no key 'whippedCream'");
                });
            });
        });

        describe("when overriding a key in a nested object", function() {
            beforeEach(function() {
                result = rspecFixtures.safeExtend(original, {
                    nestedObject: {
                        name: "pizza"
                    }
                });
            });

            it("does not mutate the original object", function() {
                expect(original.nestedObject).toEqual({
                    name: "joe",
                    id: 5
                });
            });

            it("uses the override", function() {
                expect(result.nestedObject.name).toBe("pizza");
            });

            it("preserves the other keys in the original object", function() {
                expect(result.nestedObject.id).toBe(5);
            });

            describe("when the overrides contain a key that is not present in the nested object", function() {
                it("throws an exception containing the specified name", function() {
                    expect(function() {
                        rspecFixtures.safeExtend(original, { nestedObject: { hamburger: "double" }}, "user");
                    }).toThrow("The fixture 'user.nestedObject' has no key 'hamburger'");
                });
            });

            it("does not allow keys that aren't present in the nested object", function() {
            });
        });

        describe("when overriding a value in a nested array", function() {
            beforeEach(function() {
                result = rspecFixtures.safeExtend(original, {
                    nestedStringArray: [
                        "Pivotal", "Labs", "Is", "Awesome"
                    ]
                });
            });

            it("uses the new values as-is", function() {
                expect(result.nestedStringArray).toEqual(["Pivotal", "Labs", "Is", "Awesome"]);
            });
        });

        describe("when overriding an object in a nested array", function() {
            describe("when the override array is shorter than the original array", function() {
                beforeEach(function() {
                    result = rspecFixtures.safeExtend(original, {
                        nestedObjectArray: [
                            { name: "bazillionaire" }
                        ]
                    });
                });

                it("uses the overridden properties", function() {
                    expect(result.nestedObjectArray[0].name).toBe("bazillionaire");
                });

                it("keeps each of the orginal objects' other properties", function() {
                    expect(result.nestedObjectArray[0].id).toBe(3);
                });

                it("returns an array the same length as the override array", function() {
                    expect(result.nestedObjectArray.length).toBe(1);
                });
            });

            describe("when the override array is longer than the original array", function() {
                beforeEach(function() {
                    result = rspecFixtures.safeExtend(original, {
                        nestedObjectArray: [
                            { name: "bazillionaire" },
                            { name: "gajillionaire" },
                            { name: "google" }
                        ]
                    });
                });

                it("uses the supplied values as-is", function() {
                    expect(result.nestedObjectArray[2]).toEqual({ name: "google" });
                });
            });
        });
    });
});
