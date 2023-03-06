import { Mii } from "./SaveFileReader";

export class GraphvizFamilyTree {
	constructor() {}

	public static Generate(miis: Mii[]) {
		let graphviz = "digraph G {\n\n";

		// TODO: seperate unconnected nodes further apart

		graphviz += "rankdir = TB;\n";
		graphviz += 'graph [pad="1",nodesep="0.5"];\n';
		graphviz += "edge [dir=none,penwidth=2];\n";
		// graphviz += "graph [splines=ortho];\n";
		graphviz +=
			'node [shape=box,fontname="Inter,sans-serif",imagepos="tc",labelloc="b",color="#dddddd",height="1.4"];\n';

		graphviz += "\n";

		// add all miis

		for (let miiIndex = 0; miiIndex < miis.length; miiIndex++) {
			const mii = miis[miiIndex];

			if (
				mii.spouse == null &&
				mii.mother == null &&
				mii.father == null &&
				mii.children.length == 0
			) {
				continue;
			}

			graphviz += `mii${miiIndex} [label="${mii.nickname}",image="${mii.miiImageUrl}"];\n`;
		}

		graphviz += "\n";

		// add all couples

		let couplesAdded = []; // [ [0,1], [2,3], ... ]

		const IsCoupleAdded = (i0: number, i1: number) =>
			couplesAdded.find(
				couple =>
					(couple[0] == i0 && couple[1] == i1) ||
					(couple[0] == i1 && couple[1] == i0),
			);

		for (let miiIndex = 0; miiIndex < miis.length; miiIndex++) {
			const mii = miis[miiIndex];

			if (mii.spouse != null) {
				if (IsCoupleAdded(mii.index, mii.spouse.index)) {
					continue;
				}

				graphviz += `mii${mii.index}mii${mii.spouse.index}couple [label="",height=0.01,width=0.01,color="#F44336",shape=point];\n`;

				graphviz += `mii${mii.index} -> mii${mii.index}mii${mii.spouse.index}couple -> mii${mii.spouse.index} [color="#F44336"];\n`;

				graphviz += `{ rank=same; mii${mii.index}; mii${mii.index}mii${mii.spouse.index}couple; mii${mii.spouse.index} };\n`;

				if (mii.children.length > 0) {
					graphviz += `mii${mii.index}mii${mii.spouse.index}children [label="",height=0.01,width=0.01,color="black",shape=point];\n`;

					graphviz += `mii${mii.index}mii${mii.spouse.index}couple -> mii${mii.index}mii${mii.spouse.index}children;\n`;
				}

				graphviz += "\n";

				couplesAdded.push([mii.index, mii.spouse.index]);
			}
		}

		// add all children

		for (let miiIndex = 0; miiIndex < miis.length; miiIndex++) {
			const mii = miis[miiIndex];

			// TODO: can mothers and fathers die????
			if (mii.mother == null || mii.father == null) {
				continue;
			}

			const couple = IsCoupleAdded(mii.father.index, mii.mother.index);

			if (couple) {
				graphviz += `mii${couple[0]}mii${couple[1]}children -> mii${mii.index};\n`;
			} else {
				graphviz += `mii${mii.father.index} -> mii${mii.index};\n`;
				graphviz += `mii${mii.mother.index} -> mii${mii.index};\n`;
			}

			graphviz += "\n";
		}

		graphviz += "}\n";

		return graphviz;
	}
}
