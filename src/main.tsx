import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "@fontsource/inter/100.css";
import "@fontsource/inter/200.css";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/inter/900.css";

const theme = extendTheme({
	fonts: {
		heading: `"Inter", sans-serif`,
		body: `"Inter", sans-serif`,
	},
	components: {
		Heading: {
			baseStyle: {
				letterSpacing: "-0.5px",
			},
		},
	},
});

function Root() {
	return (
		<ChakraProvider theme={theme}>
			<App />
		</ChakraProvider>
	);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Root />);
