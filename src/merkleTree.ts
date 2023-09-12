import { BigNumber, BigNumberish } from "ethers";

class JsStorage {
    constructor(public db: { [key: string]: BigNumber } = {}) {}

    get(key: string) {
        return this.db[key];
    }

    get_or_element(key: string, defaultElement: BigNumber) {
        const element = this.db[key];
        if (element === undefined) {
            return defaultElement;
        } else {
            return element;
        }
    }

    put(key: string, value: BigNumber) {
        if (key === undefined || value === undefined) {
            throw Error("key or value is undefined");
        }
        this.db[key] = value;
    }

    del(key: string) {
        delete this.db[key];
    }

    put_batch(key_values: { key: string; value: BigNumber }[]) {
        key_values.forEach((element) => {
            this.db[element.key] = element.value;
        });
    }
}

export interface Hasher {
    hash(left: BigNumber, right: BigNumber): BigNumber;
}

interface Handler {
    handle_index(i: number, current_index: number, sibling_index: number): void;
}

export class MerkleTree {
    zero_values: BigNumber[];
    public totalElements: number;

    constructor(
        public n_levels: number,
        public zV: string,
        public prefix: string,
        public hasher: Hasher,
        public storage = new JsStorage()
    ) {
        this.zero_values = [];
        this.totalElements = 0;

        let current_zero_value =
            BigNumber.from(zV);
        this.zero_values.push(current_zero_value);
        for (let i = 0; i < n_levels; i++) {
            current_zero_value = this.hasher.hash(
                current_zero_value,
                current_zero_value
            );
            this.zero_values.push(current_zero_value);
        }
    }

    static index_to_key(prefix: string, level: number, index: number) {
        const key = `${prefix}_tree_${level}_${index}`;
        return key;
    }

    async root() {
        let root = await this.storage.get_or_element(
            MerkleTree.index_to_key(this.prefix, this.n_levels, 0),
            this.zero_values[this.n_levels]
        );

        return root;
    }

    async path(index: number) {
        class PathTraverser {
            path_elements: BigNumber[];
            path_index: number[];
            constructor(
                public prefix: string,
                public storage: JsStorage,
                public zero_values: BigNumber[]
            ) {
                this.path_elements = [];
                this.path_index = [];
            }

            async handle_index(
                level: number,
                element_index: number,
                sibling_index: number
            ) {
                const sibling = await this.storage.get_or_element(
                    MerkleTree.index_to_key(this.prefix, level, sibling_index),
                    this.zero_values[level]
                );
                this.path_elements.push(sibling);
                this.path_index.push(element_index % 2);
            }
        }
        index = Number(index);
        let traverser = new PathTraverser(
            this.prefix,
            this.storage,
            this.zero_values
        );
        const root = await this.storage.get_or_element(
            MerkleTree.index_to_key(this.prefix, this.n_levels, 0),
            this.zero_values[this.n_levels]
        );

        const element = await this.storage.get_or_element(
            MerkleTree.index_to_key(this.prefix, 0, index),
            this.zero_values[0]
        );

        await this.traverse(index, traverser);
        return {
            root,
            path_elements: traverser.path_elements,
            path_index: index,
            element,
        };
    }

    async update(index: number, element: BigNumber, insert = false) {
        if (!insert && index >= this.totalElements) {
            throw Error("Use insert method for new elements.");
        } else if (insert && index < this.totalElements) {
            throw Error("Use update method for existing elements.");
        }
        try {
            class UpdateTraverser {
                key_values_to_put: { key: string; value: BigNumber }[];
                original_element: BigNumber = BigNumber.from(0);
                constructor(
                    public prefix: string,
                    public storage: JsStorage,
                    public hasher: Hasher,
                    public current_element: BigNumber,
                    public zero_values: BigNumber[]
                ) {
                    this.key_values_to_put = [];
                }

                async handle_index(
                    level: number,
                    element_index: number,
                    sibling_index: number
                ) {
                    if (level == 0) {
                        this.original_element =
                            await this.storage.get_or_element(
                                MerkleTree.index_to_key(
                                    this.prefix,
                                    level,
                                    element_index
                                ),
                                this.zero_values[level]
                            );
                    }
                    const sibling = await this.storage.get_or_element(
                        MerkleTree.index_to_key(
                            this.prefix,
                            level,
                            sibling_index
                        ),
                        this.zero_values[level]
                    );
                    let left: BigNumber, right: BigNumber;
                    if (element_index % 2 == 0) {
                        left = this.current_element;
                        right = sibling;
                    } else {
                        left = sibling;
                        right = this.current_element;
                    }

                    this.key_values_to_put.push({
                        key: MerkleTree.index_to_key(
                            this.prefix,
                            level,
                            element_index
                        ),
                        value: this.current_element,
                    });
                    this.current_element = this.hasher.hash(left, right);
                }
            }
            let traverser = new UpdateTraverser(
                this.prefix,
                this.storage,
                this.hasher,
                element,
                this.zero_values
            );

            await this.traverse(index, traverser);
            traverser.key_values_to_put.push({
                key: MerkleTree.index_to_key(this.prefix, this.n_levels, 0),
                value: traverser.current_element,
            });

            await this.storage.put_batch(traverser.key_values_to_put);
        } catch (e) {
            console.error(e);
        }
    }

    async insert(element: BigNumber) {
        const index = this.totalElements;
        await this.update(index, element, true);
        this.totalElements++;
    }

    async traverse(index: number, handler: Handler) {
        let current_index = index;
        for (let i = 0; i < this.n_levels; i++) {
            let sibling_index = current_index;
            if (current_index % 2 == 0) {
                sibling_index += 1;
            } else {
                sibling_index -= 1;
            }
            await handler.handle_index(i, current_index, sibling_index);
            current_index = Math.floor(current_index / 2);
        }
    }

    getIndexByElement(element: BigNumber) {
        for (let i = this.totalElements - 1; i >= 0; i--) {
            const elementFromTree = this.storage.get(
                MerkleTree.index_to_key(this.prefix, 0, i)
            );
            if (elementFromTree === element) {
                return i;
            }
        }
        return false;
    }
}