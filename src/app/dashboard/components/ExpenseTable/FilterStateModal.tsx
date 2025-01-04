import { IFilterState } from "./types"

interface IFilterStateModal {
    filterState: IFilterState;
    onReset: () => void;
}

const FilterStateModal: React.FC<IFilterStateModal> = ({filterState, onReset}) => {
    console.log(filterState);
    return (
        <div>
            <button onClick={onReset}>
                <span>Reset</span>
            </button>
        </div>
    );
}

export default FilterStateModal;