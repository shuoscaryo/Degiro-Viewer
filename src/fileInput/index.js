import { newElement } from "/src/utils.js"
import handler_fileUpload from './handler_fileUpload.js'
import Component from '/src/Component.js'

export default class FileInput extends Component
{
  constructor()
  {
    super(newElement("section", {id: "fileInput"}));
    this.fileInput = newElement("input", {parent: this.element, accept: ".csv", type: "file"});
  }

  onMount()
  {
    this.fileInput.addEventListener("change", handler_fileUpload);  
  }

  onDestroy()
  {
    this.fileInput.removeEventListener("change", handler_fileUpload);
  }
}
