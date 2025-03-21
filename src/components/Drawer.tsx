import '../styles/drawer.css'
import { onMount } from "solid-js";
import Drawer from "@corvu/drawer";
import type { ParentComponent } from "solid-js";


const DrawerComponent: ParentComponent = (props) => {
  return (
    <Drawer breakPoints={[0.70]} velocityFunction={() => 1}>
      {(drawerProps) => (
        <>
          <Drawer.Trigger> 
            <svg width="24" height="24" fill="none" style="padding: 1px;" viewBox="0 0 24 24">
              <path d="M11.75 3a.75.75 0 0 1 .743.648l.007.102.001 7.25h7.253a.75.75 0 0 1 .102 1.493l-.102.007h-7.253l.002 7.25a.75.75 0 0 1-1.493.101l-.007-.102-.002-7.249H3.752a.75.75 0 0 1-.102-1.493L3.752 11h7.25L11 3.75a.75.75 0 0 1 .75-.75Z" fill="oklch(var(--gray-95))"/>
            </svg>
          </Drawer.Trigger>
          
          <Drawer.Portal>
            <Drawer.Overlay
              style={{
                "background-color": `rgb(0 0 0 / ${0.5 * drawerProps.openPercentage})`,
              }}
            />
            <Drawer.Content>
              <Drawer.Close> 
                <div style="margin-right: var(--gap-x04); display: flex; place-content: flex-end;">
                  <svg style="opacity:20%" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm3.53 6.47-.084-.073a.75.75 0 0 0-.882-.007l-.094.08L12 10.939l-2.47-2.47-.084-.072a.75.75 0 0 0-.882-.007l-.094.08-.073.084a.75.75 0 0 0-.007.882l.08.094L10.939 12l-2.47 2.47-.072.084a.75.75 0 0 0-.007.882l.08.094.084.073a.75.75 0 0 0 .882.007l.094-.08L12 13.061l2.47 2.47.084.072a.75.75 0 0 0 .882.007l.094-.08.073-.084a.75.75 0 0 0 .007-.882l-.08-.094L13.061 12l2.47-2.47.072-.084a.75.75 0 0 0 .007-.882l-.08-.094-.084-.073.084.073Z" fill="oklch(var(--gray-95))"/>
                  </svg>
                </div>
              </Drawer.Close>         
              {props.children}
              <Drawer.Description></Drawer.Description>
            </Drawer.Content>
          </Drawer.Portal>
        </>
      )}
    </Drawer>
  );
};

export default DrawerComponent;

onMount(() => { 
  document.getElementById("add-drawer-trigger")!.classList.remove('blink');
});