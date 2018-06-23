import math


def get_count_digits(number: int):
    """Return number of digits in a number."""

    if number == 0:
        return 1

    number = abs(number)

    if number <= 999999999999997:
        return math.floor(math.log10(number)) + 1

    count = 0
    while number:
        count += 1
        number //= 10
    return count

def mensajeRango(pages,currentpage,rows,elementos,search=None):
    if pages == 0:
        return ''
    if not search:
        if pages == 1:
            return "{} filas en total".format(elementos)
        elif currentpage == pages:
            return "{}-{} de {} elementos".format((currentpage-1)*rows + 1,elementos,elementos)
        return "{}-{} de {} elementos".format((currentpage - 1) * rows + 1, currentpage * rows, elementos)
    if pages == 1:
        return "{} resultados para {}".format(elementos, search)
    elif currentpage == pages:
        return "{}-{} de {} para {}".format((currentpage-1)*rows + 1,elementos,elementos,search)
    return "{}-{} de {} para {}".format((currentpage-1)*rows + 1, currentpage * rows)
