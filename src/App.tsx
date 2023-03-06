import Graphviz from "./ui/Graphviz";
import { useCallback, useState } from "react";
import { GraphvizFamilyTree } from "./classes/GraphvizFamilyTree";
import { Region, SaveFileReader } from "./classes/SaveFileReader";
import DragAndDropFile from "./ui/DragAndDropFile";

export default function App() {
	const [loading, setLoading] = useState(() => false);
	const [graphvizImages, setGraphvizImages] = useState(() => []);
	const [graphvizDot, setGraphvizDot] = useState(() => "");

	const onFile = useCallback(async (file: File) => {
		setLoading(true);

		const saveFileReader = new SaveFileReader(
			await file.arrayBuffer(),
			Region.Default,
		);

		const miis = await saveFileReader.GetMiiData();

		setGraphvizImages(
			miis.map(mii => ({
				path: mii.miiImageUrl,
				width: "128px",
				height: "128px",
			})),
		);

		const graphvizDot = GraphvizFamilyTree.Generate(miis);
		console.log(graphvizDot);

		setGraphvizDot(graphvizDot);
	}, []);

	return graphvizDot == "" ? (
		<DragAndDropFile onFile={onFile} loading={loading} />
	) : (
		<Graphviz
			dot={graphvizDot}
			options={{
				zoom: false,
				width: "100vw",
				height: "100vh",
				images: graphvizImages,
			}}
		/>
	);
}
