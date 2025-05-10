import {cardsList, setcardsList} from "./cardsLogic"
import { createSignal, createEffect } from "solid-js";
import { element } from "../utils/elementUtils";
import { dbUpserelate, dbReadRelation, type ReadAllResultTypes } from "../utils/surrealdb-indexed"


 const intialcardsList = await dbReadRelation("Vaults", "Vaults_has", "Cards", "test3");
 if (intialcardsList) {setcardsList(intialcardsList)}



createEffect(() => {(async () => {

    const fragment = document.createDocumentFragment();
    const cardsArray = document.getElementById("cards-array")!;
    cardsArray.textContent = "";
    
    const availableCards = (cardsList() ?? []).filter(item => item.status === "available");

    availableCards.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .forEach((entry) => {

      fragment.append(
        element.configure('div', { className: 'entry-item', append: [
          element.configure('div', {append: [

            element.configure('p', { className: 'hint ellipsis', 
              style: "width: 20ch",
              textContent: entry.name || 'untitled' 
          	}),

			element.configure('div', { append: 
				(entry.data ?? []).map((dataItem) => {
			    return element.configure('button', { dataset: {action: 'copy'},
			    	textContent: dataItem,
			    	className: 'ellipsis',
			    	style:"text-align: start; width: 19ch;",
			    });
			  })
			}),

          ]}),

          element.configure('div', {className: 's-container',append: [

            element.configure('details', { 
              name: 'delete-item', 
              className: 'right-to-left',
              append: [
                element.configure('summary',{ className: 'right-to-left' }), 
                element.configure('button', { dataset: {action: 'delete'},
                  id: entry.id?.id ?? '',
                  textContent: ' Delete'}),
              ]
            }),

            element.configure('button', { dataset: {action: 'update'},
            	id: entry.id?.id ?? '', 
            	append: [
              element.draw("svg", { style: "width: var(--gap-x04); height: var(--gap-x04);",viewBox: "0 0 24 24", fill: "none",append: 
                element.draw("path", {d: "M21.03 2.97a3.578 3.578 0 0 1 0 5.06L9.062 20a2.25 2.25 0 0 1-.999.58l-5.116 1.395a.75.75 0 0 1-.92-.921l1.395-5.116a2.25 2.25 0 0 1 .58-.999L15.97 2.97a3.578 3.578 0 0 1 5.06 0ZM15 6.06 5.062 16a.75.75 0 0 0-.193.333l-1.05 3.85 3.85-1.05A.75.75 0 0 0 8 18.938L17.94 9 15 6.06Zm2.03-2.03-.97.97L19 7.94l.97-.97a2.079 2.079 0 0 0-2.94-2.94Z"})
              })
            ]}),
          ]})
        ]})
      );
    });

    cardsArray.append(fragment);

})();});
