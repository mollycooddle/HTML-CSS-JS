function processTableColumn(table, columns){

    //считываем строки
    let rows = Array.from(table.rows).slice(2);

    let results = [];

    //идём по столбцам
    for (let index of columns){
        let columnsCells = [];

        //идём по строкам и добавляем в массив элементы ячеек текущего столбца
        for (let i = 0; i < rows.length; i++){

            if (rows[i] && rows[i].cells && index < rows[i].cells.length) {
                columnsCells.push(rows[i].cells[index]);
            }
        }

        //т к 1 столбец особенный(с объединёнными ячейками), для него отдельный случай
        // if (index === 0){
        //     //Считаем уникальные значения, т к объединённые строки дублируют значения
        //     let uniqueValues = new Set();

        //     for (let cell of columnsCells){
        //         //Убрали пробелы в строке и добавили
        //         if (cell) {
        //             let cellText = cell.textContent.trim();
        //             uniqueValues.add(cellText);
        //         }
        //     }
        //     results.push(uniqueValues.size);
        //     continue;
        // }


        let isNumber = true;
        let hasAnyNumber = false;

        for(let cell of columnsCells){
            if (cell) {
                let cellText = cell.textContent.trim();

                if (cellText !== ''){
                    //Пробуем преобразовать элемент в число, заменяя , на .
                    let number = parseFloat(cellText.replace(',', '.'));

                    //Если не число то ломаем всё
                    if (isNaN(number)){
                        isNumber = false;
                    }
                    else{
                        hasAnyNumber = true;
                    }
                }
            }
        }

        let columnResult;

        if (isNumber && hasAnyNumber && index !== 0){
            let sum = 0;

            for(let cell of columnsCells){
                if (cell) {
                    const cellText = cell.textContent.trim();
                    
                    if (cellText !== '') {
                        const number = parseFloat(cellText.replace(',', '.'));
                        
                        if (!isNaN(number)){
                            console.log(`${number})`);
                            sum += number;
                        }
                    }
                }
            }
            console.log('---------------');

            columnResult = sum;
        }
        else{
            let nonEmptyCell = 0;

            for (let cell of columnsCells){
                if (cell && cell.textContent.trim() !== '') {
                    nonEmptyCell++;
                }
            }

            columnResult = nonEmptyCell;
        }

        results.push(columnResult);
    }

    //Создаём новую строку, totalColumns - число столбцов
    let newRow = table.insertRow();
    let totalColumns = 0;
    for (let i = 0; i < table.rows.length; i++) {
        totalColumns = Math.max(totalColumns, table.rows[i].cells.length);
    }

    //Идём по столбцам, добавляем в строку ячейки, проверяем есть ли этот столбец в исходной таблице, если есть то добавляем ячейку, иначе оставляем пустой
    for (let i = 0; i < totalColumns; i++){
        let cell = newRow.insertCell();
        
        const resultIndex = columns.indexOf(i);
        
        if (resultIndex !== -1) {
            cell.textContent = results[resultIndex];
        } else {
            cell.textContent = '';
        }
    }

    return results;
}

document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('Table');
    const columns = [0, 1, 2, 3, 4, 5];
    processTableColumn(table, columns);
});