using FluentValidation;
using StockHub.Services;

namespace StockHub.Controllers.Stocks;

public class StockPostDtoValidator : StockBaseDtoValidator<StockPostDto>
{
    public StockPostDtoValidator(TickerIdParser tickerIdParser)
    {
        RuleFor(x => x.stockId)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(x => x.stockId)
            .Must(stockId => tickerIdParser.TryParseExact(stockId, out _))
            .WithMessage("Invalid Stock Id format");
    }
}