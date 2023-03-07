import { Mii } from "./SaveFileReader";

export const heartIconSvgDataUri =
	"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgNjQgOTYwIDk2MCIgZmlsbD0iI0Y0NDMzNiI+PHBhdGggZD0ibTQ4MCA5MzUtNDEtMzdxLTEwNi05Ny0xNzUtMTY3LjV0LTExMC0xMjZRMTEzIDU0OSA5Ni41IDUwNFQ4MCA0MTNxMC05MCA2MC41LTE1MC41VDI5MCAyMDJxNTcgMCAxMDUuNSAyN3Q4NC41IDc4cTQyLTU0IDg5LTc5LjVUNjcwIDIwMnE4OSAwIDE0OS41IDYwLjVUODgwIDQxM3EwIDQ2LTE2LjUgOTFUODA2IDYwNC41cS00MSA1NS41LTExMCAxMjZUNTIxIDg5OGwtNDEgMzd6Ii8+PC9zdmc+";

export class GraphvizFamilyTree {
	constructor() {}

	public static Generate(miis: Mii[]) {
		let graphviz = 'digraph "" {\n\n';

		// TODO: seperate unconnected nodes further apart

		graphviz += "rankdir = TB;\n";
		graphviz += 'graph [pad="1",nodesep="0.5"];\n';
		graphviz += "edge [dir=none,penwidth=2];\n";
		// graphviz += "graph [splines=ortho];\n";
		graphviz +=
			'node [shape=box,fontname="Inter,sans-serif",imagepos="tc",labelloc="b",color="#dddddd",height="1.4"];\n';

		graphviz += "\n";

		// add all miis

		for (const mii of miis) {
			if (
				mii.spouse == null &&
				mii.mother == null &&
				mii.father == null &&
				mii.children.length == 0
			) {
				continue;
			}

			graphviz += `mii${mii.index} [label="${mii.nickname}",image="${mii.miiImageUrl}"];\n`;
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

		for (const mii of miis) {
			if (mii.spouse != null) {
				if (IsCoupleAdded(mii.index, mii.spouse.index)) {
					continue;
				}

				graphviz += `mii${mii.index}mii${mii.spouse.index}couple [label="",height=0.25,width=0.25,color="#F44336",shape=circle,penwidth="2",image="${heartIconSvgDataUri}"];\n`;

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

		for (const mii of miis) {
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
