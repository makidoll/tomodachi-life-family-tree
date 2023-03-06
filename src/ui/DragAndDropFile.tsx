import { Box, Heading, Text, chakra, Spinner } from "@chakra-ui/react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { MdInsertDriveFile } from "react-icons/md";

export default function DragAndDropFile(props: {
	onFile: (file: File) => {};
	loading: boolean;
}) {
	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			if (props.loading) return;
			props.onFile(acceptedFiles[0]);
		},
		[props.loading],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
	});

	return (
		<Box
			width={"100vw"}
			height={"100vh"}
			display={"flex"}
			alignItems="center"
			justifyContent="center"
			flexDir={"column"}
			{...(props.loading ? {} : getRootProps())}
		>
			{props.loading ? <></> : <input {...getInputProps()} />}
			<Heading fontWeight={600} mb={4}>
				Tomodachi Life Family Tree
			</Heading>
			<Heading fontWeight={500} size="md" mb={8} textAlign={"center"}>
				Find your{" "}
				<chakra.span color="#e91e63">savedataArc.txt</chakra.span> file
				and use it below
			</Heading>
			<Box shadow={"2xl"} borderRadius={16} mb={16}>
				<Box
					border={props.loading ? "" : "dotted 3px #ccc"}
					display="flex"
					width={500}
					height={300}
					alignItems="center"
					justifyContent="center"
					textAlign={"center"}
					borderRadius={8}
					margin={8}
					flexDir="column"
					background={isDragActive ? "#eee" : "transparent"}
					cursor="pointer"
				>
					{props.loading ? (
						<></>
					) : (
						<MdInsertDriveFile
							size={48}
							color="#e91e63"
							style={{ marginBottom: 8 }}
						/>
					)}
					<Text
						fontSize={"xl"}
						fontWeight={500}
						lineHeight={"1.6rem"}
					>
						{props.loading ? (
							<>
								<Spinner
									thickness="4px"
									speed="0.65s"
									emptyColor="gray.100"
									color="#e91e63"
									size="xl"
									marginBottom={4}
								/>
								<br />
								<chakra.span fontWeight={500} fontSize={"md"}>
									Loading save file...
								</chakra.span>
							</>
						) : (
							<>
								Drag and drop file
								<br />
								or{" "}
								<chakra.span color="#e91e63">
									click to browse
								</chakra.span>
								<br />
							</>
						)}
					</Text>
				</Box>
			</Box>
		</Box>
	);
}
