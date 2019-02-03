import Axios, { AxiosPromise } from 'axios';
import { CheckCategory } from '@/store/types';

/**
 * The base of a check, containing all metadata but no content.
 */
export class CheckBase {
  id: number;
  creator: string;
  name: string;
  approved: boolean;
  category: CheckCategory;
  className: string;
  checkType: string | null;

  constructor(
    id: number,
    creator: string,
    name: string,
    approved: boolean,
    category: CheckCategory,
    className: string,
    checkType: string | null
  ) {
    this.id = id;
    this.creator = creator;
    this.name = name;
    this.approved = approved;
    this.category = category;
    this.className = className;
    this.checkType = checkType;
  }
}

export class IOCheck {
  input: string;
  name: string;

  constructor(input: string, name: string) {
    this.input = input;
    this.name = name;
  }
}

/**
 * A collection of CheckBases and their content, lazily fetched.
 */
export class CheckCollection {
  private checkBases: Array<CheckBase> = []
  private checkContents: any = {}

  /**
   * Fetches the content for a single check. The promise resolves when the content
   * is saved in this collection.
   * 
   * @param check the check to fetch the content for
   */
  async fetchContent(check: CheckBase): Promise<any> {
    if (this.checkContents[check.id]) {
      return Promise.resolve(this.checkContents[check.id])
    }
    const response = await Axios.get("/checks/get-content", {
      params: {
        id: check.id
      }
    });
    this.checkContents[check.id] = response.data.content;
    
    return this.checkContents[check.id];
  }

  /**
   * Deletes a single check. The promise resolves if it was successfully deted.
   * 
   * @param check the check to delete
   */
  async deleteCheck(check: CheckBase): Promise<void> {
    const _ = await Axios.delete("/checks/remove/" + check.id);
    const index = this.checkBases.indexOf(check);
    if (index >= 0) {
      this.checkBases.splice(index, 1);
      delete this.checkContents[check.id];
    }
  }

  /**
   * Sets the approval status for a check. The promise resolves after the status was set.
   * 
   * @param check the check to change the approval status for
   * @param approved whether the check is approved
   */
  async setCheckApproval(check: CheckBase, approved: boolean): Promise<void> {
    const formData = new FormData();
    formData.append("id", check.id.toString());
    formData.append("approved", approved ? "true" : "false");

    const response = await Axios.post("/checks/approve", formData);
    check.approved = approved;
  }

  /**
   * Fetches all checks. The promise resolves after they have been fetched.
   */
  async fetchAll(): Promise<void> {
    const response = await Axios.get("/checks/get-all");
    this.checkBases = (response.data as Array<CheckBase>);
    const scratchObject = ({} as any);
    this.checkBases.forEach(it => (scratchObject[it.id] = undefined));
    // This is needed as vue can not observe property addition/deletion
    // So we just build the full object and then assign to to vue (and making it reactive)
    this.checkContents = scratchObject;

    this.sort()
  }

  /**
   * Updates an IO check.
   * 
   * @param check the check data
   * @param id the check id
   */
  async updateIoCheck(check: IOCheck, id: number): Promise<void> {
    const checkData: any = {
      data: check.input,
      name: check.name
    };

    const response = await Axios.post(`/checks/update/${id}`, {
      value: JSON.stringify(checkData),
      class: "InterleavedStaticIOCheck"
    });
    this.checkContents[id] = response.data.text;
  }

  private sort() {
    this.checkBases.sort((a, b) => {
      // compare by category descending (so higher ones in a nice format are first)
      if (a.category.name.toLowerCase() > b.category.name.toLowerCase()) return -1;
      if (a.category.name.toLowerCase() < b.category.name.toLowerCase()) return 1;

      // then by name
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
      if (a.name.toLowerCase() == b.name.toLowerCase()) return 0;

      return 1;
    })
  }
}
