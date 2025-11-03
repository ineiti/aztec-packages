mod registry;

use functions::utils::{transform_private, transform_public, transform_utility};
use registry::{get_private_functions, get_public_functions, get_utility_functions};

pub(crate) comptime fn process_functions(m: Module) -> Quoted {
    let private_functions =
        get_private_functions(m).map(|function| transform_private(functions)).join(quote {});
    let public_functions =
        get_public_functions(m).map(|function| transform_public(functions)).join(quote {});
    let utility_functions =
        get_utility_functions(m).map(|function| transform_utility(functions)).join(quote {});

    // Now that we have generated quotes of the new functions based on the original function definitions, we replace
    // the original functions' bodies with `static_assert(false, ...)` to prevent them from being called directly
    // from within the contract.
    private_functions.foreach(|function| quote {
        let name = function.name();
        function.set_body(quote {
            static_assert(false, f"Direct invocation of private functions is not supported. You attempted to call {name}. Please see the documentation for instructions on the proper invocation of private functions: INCLUDE_LINK_HERE");
        });
    });
    public_functions.foreach(|function| {
        let name = function.name();
        function.set_body(
            quote {
            static_assert(false, f"Direct invocation of public functions is not supported. You attempted to call {name}. Please see the documentation for instructions on the proper invocation of public functions: INCLUDE_LINK_HERE");
        },
        );
    });
    utility_functions.foreach(|function| {
        let name = function.name();
        function.set_body(
            quote {
            static_assert(false, f"Calling utility functions directly from within the contract is not supported. You attempted to call {name}. Please see the documentation for instructions on the proper use of utility functions: INCLUDE_LINK_HERE");
        },
        );
    });

    // We return the new functions' quotes to be injected into the contract.
    quote {
        $private_functions
        $public_functions
        $utility_functions
    }
}
