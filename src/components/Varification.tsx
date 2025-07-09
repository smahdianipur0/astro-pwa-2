import { pass } from "../logic/pass";
import type { JSX } from "solid-js";

const parentStyle = "color: oklch(var(--gray-95)); display: flex; position: relative; justify-content: space-between; align-items: center;";
const detailStyle = "line-height: var(--size-sm4);font-weight: 300;font-size:var(--font-lg1); height:var(--size-sm4);";
const resStyle =    "font-variant-numeric: tabular-nums; font-size:var(--font-lg1);";

export function Verification(): JSX.Element {

    switch (true) {

        case pass.get("secretKey") === "":
            document.getElementById("Varification")!.style.maxHeight = "var(--size-xl2)";
            break;

        case pass.get("secretKey") !== pass.get("varificationKey") && (!pass.get("keyIvIsValid") || pass.get("secretKey") === "Invalid Credentials"):
            document.getElementById("Varification")!.style.maxHeight ="var(--size-xl5)";
            return (
                <div style={parentStyle}>
                    <div id="Varification-target-detail" style={detailStyle}>
                        {pass.get("secretKey")}
                    </div>
                </div>
            );

        case pass.get("otpRes") === "The provided key is not valid.":
            document.getElementById("Varification")!.style.maxHeight = "var(--size-xl5)";
            return (
                <div style={parentStyle}>
                    <div id="Varification-target-detail" style={detailStyle}>
                        {pass.get("otpRes")}
                    </div>
                </div>
            );

        default:
            document.getElementById("Varification")!.style.maxHeight = "var(--size-xl5)";
            return (
                <>
                    <div style={parentStyle}>
                        <div id="Varification-target-detail" style={detailStyle}>Varification Code:</div>
                        <div id="Varification-target-res" style={resStyle}> {pass.get("otpRes")}</div>
                    </div>

                    <small id="Varification-hint" style="white-space: pre-line; font-variant-numeric: tabular-nums; " >
                        This code is valid for the next {pass.get("countDown")} seconds. <br/> Tap to copy 
                    </small>
                </>
            );

    }
}